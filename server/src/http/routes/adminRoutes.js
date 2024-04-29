const express = require("express");
const { oleoduc, transformIntoJSON, compose, transformIntoCSV } = require("oleoduc");
const Joi = require("@hapi/joi");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User, Formateur, Responsable, Delegue, Relation } = require("../../common/model");
const { getAcademies } = require("../../common/academies");
const { aggregate } = require("../../common/utils/mongooseUtils");
const authMiddleware = require("../middlewares/authMiddleware");
const { changeEmail } = require("../../common/actions/changeEmail");
const { markAsNonConcerne } = require("../../common/actions/markAsNonConcerne");
const { cancelUnsubscription } = require("../../common/actions/cancelUnsubscription");
const { dateAsString } = require("../../common/utils/stringUtils.js");
const { siretFormat, uaiFormat } = require("../../common/utils/format");
const { UserStatut } = require("../../common/constants/UserStatut");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const resendConfirmationEmails = require("../../jobs/resendConfirmationEmails");
const resendActivationEmails = require("../../jobs/resendActivationEmails");
const resendNotificationEmails = require("../../jobs/resendNotificationEmails");
const sendConfirmationEmails = require("../../jobs/sendConfirmationEmails");
const sendActivationEmails = require("../../jobs/sendActivationEmails");
const { saveAccountEmailUpdatedByAdmin } = require("../../common/actions/history/responsable");
const { saveDelegationCreatedByAdmin } = require("../../common/actions/history/relation");
const { saveDelegationUpdatedByAdmin } = require("../../common/actions/history/relation");
const { saveDelegationCancelledByAdmin } = require("../../common/actions/history/relation");
const { UserType } = require("../../common/constants/UserType");
const { download } = require("../../jobs/download");
const logger = require("../../common/logger.js");
const Boom = require("boom");

const lookupRelations = {
  from: Relation.collection.name,
  let: { userSiret: "$siret", userUai: "$uai", userType: "$type" },
  pipeline: [
    {
      $match: {
        $expr: {
          $or: [
            {
              $and: [
                { $eq: ["$$userType", UserType.FORMATEUR] },
                { $eq: ["$etablissement_formateur.uai", "$$userUai"] },
              ],
            },
            {
              $and: [
                { $eq: ["$$userType", UserType.RESPONSABLE] },
                { $eq: ["$etablissement_responsable.siret", "$$userSiret"] },
              ],
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: Formateur.collection.name,
        localField: "etablissement_formateur.uai",
        foreignField: "uai",
        pipeline: [
          {
            $match: {
              type: UserType.FORMATEUR,
            },
          },
        ],
        as: "formateur",
      },
    },

    {
      $lookup: {
        from: Responsable.collection.name,
        localField: "etablissement_responsable.siret",
        foreignField: "siret",
        pipeline: [
          {
            $match: {
              type: UserType.RESPONSABLE,
            },
          },
        ],
        as: "responsable",
      },
    },

    {
      $lookup: {
        from: Delegue.collection.name,
        let: {
          siret_responsable: "$etablissement_responsable.siret",
          uai_formateur: "$etablissement_formateur.uai",
        },
        pipeline: [
          {
            $match: {
              type: UserType.DELEGUE,
            },
          },

          {
            $unwind: {
              path: "$relations",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$relations.etablissement_responsable.siret", "$$siret_responsable"] },
                  { $eq: ["$relations.etablissement_formateur.uai", "$$uai_formateur"] },
                  { $eq: ["$relations.active", true] },
                ],
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              root: {
                $first: "$$ROOT",
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: "$root",
            },
          },
          {
            $project: { password: 0 },
          },
        ],
        as: "delegue",
      },
    },

    {
      $unwind: {
        path: "$responsable",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$formateur",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$delegue",
        preserveNullAndEmptyArrays: true,
      },
    },
  ],
  as: "relations",
};

const addCountFields = {
  nombre_voeux: { $sum: "$relations.nombre_voeux" },
  nombre_voeux_restant: { $sum: "$relations.nombre_voeux_restant" },
};

module.exports = ({ sendEmail, resendEmail }) => {
  const router = express.Router();
  const { checkApiToken, checkIsAdmin } = authMiddleware();

  function asCsvResponse(name, res) {
    const now = dateAsString(new Date());
    res.setHeader("Content-disposition", `attachment; filename=${name}-${now}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    return res;
  }

  // const responsableFilter = { type: UserType.ETABLISSEMENT, "etablissements_formateur.0": { $exists: true } };
  // const formateurFilter = { type: UserType.ETABLISSEMENT, "etablissements_responsable.0": { $exists: true } };

  /**
   * USER (ADMIN & ACADEMIE)
   */
  router.get(
    "/api/admin",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const user = await User.findOne({ username }).lean();

      return res.json(user);
    })
  );

  /**
   * Établissements (RESPONSABLES & FORMATEURS)
   */

  /**
   * Permet de récupérer la liste des établissements
   */
  router.get(
    "/api/admin/etablissements",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();
      const defaultAcademies = admin?.academies?.map((academie) => academie.code);

      const { academie, text, type, page, items_par_page, sort } = await Joi.object({
        academie: Joi.string().valid(...[...getAcademies().map((academie) => academie.code)]),
        text: Joi.string(),
        type: Joi.string(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
        sort: Joi.string().default(JSON.stringify({ type: -1 })),
      }).validateAsync(req.query, { abortEarly: false });

      const regex = "(.*" + text + ".*)+";
      const regexQuery = { $regex: regex, $options: "i" };

      const { find, pagination } = await aggregate(
        User,
        [
          {
            $match: {
              $and: [
                {
                  type: { $in: [UserType.FORMATEUR, UserType.RESPONSABLE] },
                },

                ...(type
                  ? // [
                    //     {
                    //       type: UserType.ETABLISSEMENT,
                    //       ...(type === UserType.FORMATEUR ? formateurFilter : {}),
                    //       ...(type === UserType.RESPONSABLE ? responsableFilter : {}),
                    //     },
                    //   ]
                    [{ type }]
                  : []),
              ],
            },
          },
          {
            $lookup: lookupRelations,
          },

          {
            $match: {
              $or: [
                {
                  // Formateur
                  type: UserType.FORMATEUR,
                  // ...formateurFilter,
                  $and: [
                    {},
                    ...(text
                      ? [
                          {
                            $or: [
                              { siret: regexQuery },
                              { uai: regexQuery },
                              { raison_sociale: regexQuery },
                              { email: regexQuery },
                              { "relations.delegue.email": regexQuery },
                              { "relations.etablissement_responsable.siret": regexQuery },
                              { "relations.etablissement_responsable.uai": regexQuery },
                            ],
                          },
                        ]
                      : []),

                    ...(academie || !!defaultAcademies?.length
                      ? [
                          {
                            $or: [{ "academie.code": { $in: academie ? [academie] : defaultAcademies } }],
                          },
                        ]
                      : []),
                  ],
                },
                {
                  // Responsables
                  type: UserType.RESPONSABLE,
                  // ...responsableFilter,
                  $and: [
                    {},
                    ...(text
                      ? [
                          {
                            $or: [
                              { siret: regexQuery },
                              { uai: regexQuery },
                              { raison_sociale: regexQuery },
                              { email: regexQuery },
                              { "relations.delegue.email": regexQuery },
                              { "relations.etablissement_formateur.siret": regexQuery },
                              { "relations.etablissement_formateur.uai": regexQuery },
                            ],
                          },
                        ]
                      : []),

                    ...(academie || !!defaultAcademies?.length
                      ? [
                          {
                            $or: [
                              { "academie.code": { $in: academie ? [academie] : defaultAcademies } },
                              {
                                relations: {
                                  $elemMatch: {
                                    "formateur?.academie.code": { $in: academie ? [academie] : defaultAcademies },
                                  },
                                },
                              },
                            ],
                          },
                        ]
                      : []),
                  ],
                },
              ],
            },
          },
          {
            $addFields: addCountFields,
          },
        ],
        {
          page,
          items_par_page,
          select: { _id: 0, password: 0 },
          sort: JSON.parse(sort ?? JSON.stringify({ type: -1 })),
        }
      );

      const stream = oleoduc(
        find.cursor(),
        transformIntoJSON({
          arrayWrapper: {
            pagination,
          },
          arrayPropertyName: "etablissements",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  /**
   * Permet de récupérer la liste des établissements sous forme de CSV
   */
  router.get(
    "/api/admin/etablissements/export.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();
      const defaultAcademies = admin?.academies?.map((academie) => academie.code);

      const { academie, text } = await Joi.object({
        academie: Joi.string().valid(...[...getAcademies().map((academie) => academie.code)]),
        text: Joi.string(),
        token: Joi.string(),
      }).validateAsync(req.query, { abortEarly: false });

      return download(asCsvResponse("export", res), {
        academies: academie ? [academie] : defaultAcademies?.length ? defaultAcademies : null,
        text,
        admin,
      });
    })
  );

  /**
   * RESPONSABLES
   * =============
   */

  /**
   * Permet de récupérer un responsable
   */
  router.get(
    "/api/admin/responsables/:siret",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      // const { username } = req.user;
      // const admin = await User.findOne({ username }).lean();

      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const responsable = (
        await Responsable.aggregate([
          { $match: { siret } },
          {
            $lookup: lookupRelations,
          },
          { $addFields: addCountFields },
        ])
      )?.[0];

      if (!responsable) {
        throw Error("Responsable introuvable");
      }

      // Responsable.populate(responsable, { path: "relations.voeux_telechargements.user", select: "-password" });

      return res.json(responsable);
    })
  );

  // router.get(
  //   "/api/admin/responsables/:siret/formateurs",
  //   checkApiToken(),
  //   checkIsAdmin(),
  //   tryCatch(async (req, res) => {
  //     const { username } = req.user;
  //     const admin = await User.findOne({ username }).lean();

  //     const { siret } = await Joi.object({
  //       siret: Joi.string().pattern(siretFormat).required(),
  //     }).validateAsync(req.params, { abortEarly: false });

  //     const responsable = (
  //       await Responsable.aggregate([
  //         { $match: { siret } },
  //         {
  //           $lookup: lookupRelations,
  //         },
  //       ])
  //     )?.[0];

  //     return res.json(
  //       await Promise.all(
  //         responsable?.relations?.map(async (relation) => {
  //           return await Formateur.aggregate([
  //             { $match: { uai: relation.etablissement_formateur.uai } },
  //             { $lookup: lookupRelations },
  //           ])?.[0];
  //         }) ?? []
  //       )
  //     );
  //   })
  // );

  /**
   * Permet à un administrateur de modifier les paramètres de diffusion d'un responsable à un de ses formateurs associés (ajout / modification)
   */
  router.post(
    "/api/admin/responsables/:siret/delegation",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });
      const { email, uai } = await Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const responsable = await Responsable.findOne({ siret }).lean();
      const formateur = await Formateur.findOne({ uai }).lean();

      const previousDelegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret,
            "etablissement_formateur.uai": uai,
            active: true,
          },
        },
      });

      // Suppression de la délégation existante si elle existe déjà entre le responsable et le formateur

      if (previousDelegue) {
        await Delegue.updateOne(
          {
            _id: previousDelegue._id,
          },
          {
            $set: {
              "relations.$[element].active": false,
            },
          },
          {
            arrayFilters: [
              { "element.etablissement_responsable.siret": siret, "element.etablissement_formateur.uai": uai },
            ],
          }
        );
      }

      const delegue = await Delegue.findOne({ email });

      if (
        !delegue?.relations?.filter(
          (relation) =>
            relation.etablissement_responsable.siret === siret && relation.etablissement_formateur.uai === uai
        ).length
      ) {
        await Delegue.updateOne(
          { email },
          {
            $setOnInsert: {
              username: email,
              email,
            },
            $addToSet: {
              relations: {
                etablissement_responsable: {
                  siret: responsable.siret,
                  uai: responsable.uai,
                },
                etablissement_formateur: {
                  siret: formateur?.siret,
                  uai: formateur?.uai,
                },
                active: true,
              },
            },
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
            new: true,
          }
        );
      } else {
        await Delegue.updateOne(
          { email },
          {
            $setOnInsert: {
              username: email,
              email,
            },
            $set: {
              "relations.$[element].active": true,
            },
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
            new: true,
            arrayFilters: [
              { "element.etablissement_responsable.siret": siret, "element.etablissement_formateur.uai": uai },
            ],
          }
        );
      }

      if (previousDelegue) {
        saveDelegationUpdatedByAdmin({ uai, siret, email }, req.user);
      } else {
        saveDelegationCreatedByAdmin({ uai, siret, email }, req.user);
      }

      const updatedDelegue = await Delegue.findOne({ email });

      if (updatedDelegue.statut === UserStatut.EN_ATTENTE) {
        await Delegue.updateOne({ email }, { $set: { statut: UserStatut.CONFIRME } });
      }

      const previousActivationEmail = updatedDelegue.emails.find((e) => e.templateName.startsWith("activation_"));
      previousActivationEmail
        ? await resendActivationEmails(resendEmail, { username: email, force: true, sender: req.user })
        : await sendActivationEmails(sendEmail, { username: email, force: true, sender: req.user });

      logger.info(`Délégation activée (${updatedDelegue.email}) pour le formateur ${uai} et le responsable ${siret}`);

      return res.json(updatedDelegue);
    })
  );

  /**
   * Permet à un administrateur de modifier les paramètres de diffusion d'un responsable à un de ses formateurs associés (suppression)
   */
  router.delete(
    "/api/admin/responsables/:siret/delegation",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret,
            "etablissement_formateur.uai": uai,
            active: true,
          },
        },
      });

      const updateDelegue = await Delegue.updateOne(
        {
          relations: {
            $elemMatch: {
              "etablissement_responsable.siret": siret,
              "etablissement_formateur.uai": uai,
              active: true,
            },
          },
        },
        {
          $set: {
            "relations.$[element].active": false,
          },
        },
        {
          arrayFilters: [
            { "element.etablissement_responsable.siret": siret, "element.etablissement_formateur.uai": uai },
          ],
        }
      );

      await saveDelegationCancelledByAdmin({ uai, siret, email: delegue?.email }, req.user);

      logger.info(`Délégation désactivée (${delegue.email}) pour le formateur ${uai} et le responsable ${siret}`);

      return res.json(updateDelegue);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/admin/responsables/:siret/formateurs/:uai/voeux",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const filename = `${siret}-${uai}.csv`;

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream({ siret, uai }), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  /**
   * Permet de modifier l'adresse courriel d'un responsable (et envoie un courriel pour confirmation de l'adresse courriel)
   *
   */
  router.put(
    "/api/admin/responsables/:siret/setEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, email } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        email: Joi.string().email().required(),
      }).validateAsync({ ...req.body, ...req.params }, { abortEarly: false });

      const responsable = await Responsable.findOne({
        siret,
      });

      // const responsable = await Etablissement.findOne({
      //   ...responsableFilter,
      //   siret,
      // });

      await changeEmail(siret, email, { auteur: req.user.username });

      await saveAccountEmailUpdatedByAdmin({ siret, email }, responsable.email, req.user);

      await Responsable.updateOne({ siret }, { $set: { statut: UserStatut.EN_ATTENTE } });
      // await Etablissement.updateOne({ ...responsableFilter, siret }, { $set: { statut: UserStatut.EN_ATTENTE } });

      const previousConfirmationEmail = responsable.emails.find((e) => e.templateName.startsWith("confirmation_"));

      previousConfirmationEmail
        ? await resendConfirmationEmails(resendEmail, { username: siret, force: true, sender: req.user })
        : await sendConfirmationEmails(sendEmail, { username: siret, sender: req.user });

      return res.json({});
    })
  );

  /**
   * Permet de renvoyer un mail de confirmation à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret/resendConfirmationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret);
      const stats = await resendConfirmationEmails(resendEmail, { username: siret, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail d'activation à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret/resendActivationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret);
      const stats = await resendActivationEmails(resendEmail, { username: siret, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail de notification à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret/resendNotificationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret);
      const stats = await resendNotificationEmails(resendEmail, { username: siret, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  /**
   * DEPRECATED :
   * Marque un responsable comme non concerné (permet de ne plus envoyer de courriels à ce responsable)
   */
  router.put(
    "/api/admin/responsables/:siret/markAsNonConcerne",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await markAsNonConcerne(siret);

      return res.json({ statut: "non concerné" });
    })
  );

  /**
   * FORMATEURS
   * =============
   */

  /**
   * Permet de récupérer un formateur
   */
  router.get(
    "/api/admin/formateurs/:uai",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      // const { username } = req.user;
      // const admin = await User.findOne({ username }).lean();

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const formateur = (
        await Formateur.aggregate([
          { $match: { uai } },
          {
            $lookup: lookupRelations,
          },
          { $addFields: addCountFields },
        ])
      )?.[0];

      logger.info(formateur);

      if (!formateur) {
        throw Error("Formateur introuvable");
      }

      return res.json(formateur);

      // const formateur = await Formateur.findOne({ uai }).lean();
      // // const formateur = await Etablissement.findOne({ ...formateurFilter, uai }).lean();

      // res.json(await fillFormateur(formateur, admin));
    })
  );

  /**
   * DELEGUES
   * =============
   */
  /**
   * Permet de renvoyer un mail d'activation à un délégué
   */
  router.put(
    "/api/admin/delegues/:siret/:uai/resendActivationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, uai } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai, active: true },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      await cancelUnsubscription(delegue.email);
      const stats = await resendActivationEmails(resendEmail, {
        username: delegue.username,
        force: true,
        sender: req.user,
      });

      return res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail de notification à un délégué
   */
  router.put(
    "/api/admin/delegues/:siret/:uai/resendNotificationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, uai } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai, active: true },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      await cancelUnsubscription(delegue.email);
      const stats = await resendNotificationEmails(resendEmail, { username: uai, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  return router;
};
