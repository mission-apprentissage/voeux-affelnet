const express = require("express");
const { compose, transformIntoCSV } = require("oleoduc");
const Joi = require("@hapi/joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User, Etablissement, Delegue, Relation } = require("../../common/model");
const { getAcademies } = require("../../common/academies");
const { aggregate } = require("../../common/utils/mongooseUtils");
const authMiddleware = require("../middlewares/authMiddleware");
const { changeEmail } = require("../../common/actions/changeEmail");
const { cancelUnsubscription } = require("../../common/actions/cancelUnsubscription");
const { dateAsString } = require("../../common/utils/stringUtils");
const { siretFormat } = require("../../common/utils/format");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream");
const sendConfirmationEmails = require("../../jobs/sendConfirmationEmails");
const sendActivationEmails = require("../../jobs/sendActivationEmails");
const sendNotificationEmails = require("../../jobs/sendNotificationEmails");
const sendUpdateEmails = require("../../jobs/sendUpdateEmails");
const { saveAccountEmailUpdatedByAdmin } = require("../../common/actions/history/responsable/index");
const { saveDelegationCreatedByAdmin } = require("../../common/actions/history/relation");
const { saveDelegationUpdatedByAdmin } = require("../../common/actions/history/relation");
const { saveDelegationCancelledByAdmin } = require("../../common/actions/history/relation");
const { USER_STATUS } = require("../../common/constants/UserStatus");
const { USER_TYPE } = require("../../common/constants/UserType");
// const { RELATION_TYPE } = require("../../common/constants/RelationType");
const { download } = require("../../jobs/download");
const logger = require("../../common/logger");
const Boom = require("boom");

const lookupRelations = {
  from: Relation.collection.name,
  let: { siret: "$siret" },
  pipeline: [
    {
      $match: {
        $expr: {
          $or: [
            {
              $and: [{ $eq: ["$etablissement_formateur.siret", "$$siret"] }],
            },
            {
              $and: [{ $eq: ["$etablissement_responsable.siret", "$$siret"] }],
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: Etablissement.collection.name,
        localField: "etablissement_formateur.siret",
        foreignField: "siret",
        as: "formateur",
      },
    },

    {
      $lookup: {
        from: Etablissement.collection.name,
        localField: "etablissement_responsable.siret",
        foreignField: "siret",
        as: "responsable",
      },
    },

    {
      $lookup: {
        from: Delegue.collection.name,
        let: {
          siret_responsable: "$etablissement_responsable.siret",
          siret_formateur: "$etablissement_formateur.siret",
        },
        pipeline: [
          {
            $match: {
              type: USER_TYPE.DELEGUE,
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
                  { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                  // { $eq: ["$relations.active", true] },
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

const addTypeFields = {
  // is_responsable: {
  //   $reduce: {
  //     input: "$relations",
  //     initialValue: false,
  //     in: {
  //       $cond: [
  //         {
  //           $or: [
  //             {
  //               $eq: ["$$this.etablissement_responsable.siret", "$siret"],
  //             },
  //             {
  //               $eq: ["$$value", true],
  //             },
  //           ],
  //         },
  //         true,
  //         false,
  //       ],
  //     },
  //   },
  // },

  // is_formateur: {
  //   $reduce: {
  //     input: "$relations",
  //     initialValue: false,
  //     in: {
  //       $cond: [
  //         {
  //           $or: [
  //             {
  //               $eq: ["$$this.etablissement_formateur.siret", "$siret"],
  //             },
  //             {
  //               $eq: ["$$value", true],
  //             },
  //           ],
  //         },
  //         true,
  //         false,
  //       ],
  //     },
  //   },
  // },

  is_formateur: {
    $reduce: {
      input: "$relations",
      initialValue: false,
      in: {
        $cond: [
          {
            $or: [
              {
                $and: [
                  {
                    $eq: ["$$this.etablissement_formateur.siret", "$siret"],
                  },
                  {
                    $ne: ["$$this.etablissement_responsable.siret", "$siret"],
                  },
                ],
              },
              {
                $eq: ["$$value", true],
              },
            ],
          },
          true,
          false,
        ],
      },
    },
  },

  is_responsable: {
    $reduce: {
      input: "$relations",
      initialValue: false,
      in: {
        $cond: [
          {
            $or: [
              {
                $and: [
                  {
                    $ne: ["$$this.etablissement_formateur.siret", "$siret"],
                  },
                  {
                    $eq: ["$$this.etablissement_responsable.siret", "$siret"],
                  },
                ],
              },
              {
                $eq: ["$$value", true],
              },
            ],
          },
          true,
          false,
        ],
      },
    },
  },

  is_responsable_formateur: {
    $reduce: {
      input: "$relations",
      initialValue: false,
      in: {
        $cond: [
          {
            $or: [
              {
                $eq: ["$$this.etablissement_responsable.siret", "$$this.etablissement_formateur.siret"],
              },
              {
                $eq: ["$$value", true],
              },
            ],
          },
          true,
          false,
        ],
      },
    },
  },
};

const addCountFields = {
  nombre_voeux: { $sum: "$relations.nombre_voeux" },
  nombre_voeux_restant: { $sum: "$relations.nombre_voeux_restant" },
};

module.exports = ({ sendEmail, resendEmail }) => {
  const router = express.Router();
  const { checkApiToken, checkIsAdminOrAcademie } = authMiddleware();

  function asCsvResponse(name, res) {
    const now = dateAsString(new Date());
    res.setHeader("Content-disposition", `attachment; filename=${name}-${now}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    return res;
  }

  /**
   * USER (ADMIN & ACADEMIE)
   */

  /**
   * Permet de récupérer les informations de l'utilisateur connecté
   */
  router.get(
    "/api/admin",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const user = await User.findOne({ username }).lean();

      res.json(user);
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
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();
      const defaultAcademies = admin?.academies?.map((academie) => academie.code);

      const { academie, text, /*type,*/ missing_email, page, items_par_page, sort } = await Joi.object({
        academie: Joi.string().valid(...[...getAcademies().map((academie) => academie.code)]),
        text: Joi.string(),
        type: Joi.string(),
        missing_email: Joi.boolean(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
        sort: Joi.string().default(JSON.stringify({ type: -1 })),
      }).validateAsync(req.query, { abortEarly: false });

      const regex = "(.*" + text?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ".*)+";
      const regexQuery = { $regex: regex, $options: "i" };

      const pipeline = [
        { $match: { type: USER_TYPE.ETABLISSEMENT } },

        ...(academie || !!defaultAcademies?.length
          ? [
              {
                $match: { "academie.code": { $in: academie ? [academie] : defaultAcademies } },
              },
            ]
          : []),

        ...(missing_email
          ? [
              {
                $match: {
                  $or: [
                    {
                      email: { $exists: false },
                    },
                    {
                      email: "",
                    },
                  ],
                },
              },
            ]
          : []),

        { $lookup: lookupRelations },
        { $addFields: addTypeFields },

        { $match: { $or: [{ is_responsable_formateur: true }, { is_responsable: true }] } },

        // ...(type === RELATION_TYPE.RESPONSABLE ? [{ $match: { is_responsable: true } }] : []),
        // ...(type === RELATION_TYPE.FORMATEUR ? [{ $match: { is_formateur: true } }] : []),
        // ...(type === RELATION_TYPE.RESPONSABLE_FORMATEUR ? [{ $match: { is_responsable_formateur: true } }] : []),

        ...(text
          ? [
              {
                $match: {
                  $or: [
                    { siret: regexQuery },
                    { uai: regexQuery },
                    { raison_sociale: regexQuery },
                    { enseigne: regexQuery },
                    { email: regexQuery },
                    // { "relations.responsable.siret": regexQuery },
                    // { "relations.responsable.uai": regexQuery },
                    // { "relations.responsable.raison_sociale": regexQuery },
                    // { "relations.responsable.enseigne": regexQuery },
                    { "relations.formateur.siret": regexQuery },
                    { "relations.formateur.uai": regexQuery },
                    { "relations.formateur.raison_sociale": regexQuery },
                    { "relations.formateur.enseigne": regexQuery },
                    // { "relations.responsable.email": regexQuery },
                    { "relations.delegue.email": regexQuery },
                  ],
                },
              },
            ]
          : []),

        // ...(missing_email
        //   ? [
        //       {
        //         $match: {
        //           $or: [
        //             {
        //               relations: {
        //                 $elemMatch: {
        //                   "responsable.email": { $exists: false },
        //                 },
        //               },
        //             },
        //             {
        //               relations: {
        //                 $elemMatch: {
        //                   "responsable.email": "",
        //                 },
        //               },
        //             },
        //           ],
        //         },
        //       },
        //     ]
        //   : []),

        { $addFields: addCountFields },
        {
          $addFields: { relations_count: { $size: { $ifNull: ["$relations", []] } } },
        },
      ];

      const { results, pagination } = await aggregate(User, pipeline, {
        page,
        items_par_page,
        select: { _id: 0, password: 0 },
        sort: JSON.parse(sort ?? JSON.stringify({ nombre_voeux_restant: -1, relations_count: 1 })),
      });

      res.json({
        etablissements: results,
        pagination,
      });
    })
  );

  /**
   * Permet de récupérer la liste des établissements sous forme de CSV
   */
  router.get(
    "/api/admin/etablissements/export.csv",
    checkApiToken(),
    checkIsAdminOrAcademie(),
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
   * Permet de récupérer un établissement
   */
  router.get(
    "/api/admin/etablissements/:siret",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const etablissement = (
        await Etablissement.aggregate([
          { $match: { siret } },
          {
            $lookup: lookupRelations,
          },
          { $addFields: addTypeFields },
          { $addFields: addCountFields },
        ])
      )?.[0];

      if (!etablissement) {
        throw Error("Etablissement introuvable");
      }

      // Responsable.populate(responsable, { path: "relations.voeux_telechargements.user", select: "-password" });

      res.json(etablissement);
    })
  );

  /** RESPONSABLES
   * =============
   */

  /**
   * @deprecated
   *
   * Permet de récupérer un responsable
   */
  router.get(
    "/api/admin/responsables/:siret_responsable",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const responsable = (
        await Etablissement.aggregate([
          { $match: { siret: siret_responsable } },
          {
            $lookup: lookupRelations,
          },
          { $addFields: addTypeFields },
          { $match: { is_responsable: true } },
          { $addFields: addCountFields },
        ])
      )?.[0];

      if (!responsable) {
        throw Error("Responsable introuvable");
      }

      res.json(responsable);
    })
  );

  /**
   * Permet à un administrateur de modifier les paramètres de diffusion d'un responsable à un de ses formateurs associés (ajout / modification)
   */
  router.post(
    "/api/admin/responsables/:siret_responsable/delegation",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });
      const { email, siret: siret_formateur } = await Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }),
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const responsable = await Etablissement.findOne({ siret: siret_responsable }).lean();
      const formateur = await Etablissement.findOne({ siret: siret_formateur }).lean();

      const previousDelegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
            // active: true,
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
            $pull: {
              relations: {
                "etablissement_responsable.siret": siret_responsable,
                "etablissement_formateur.siret": siret_formateur,
              },
            },
          }
        );
      }

      const delegue = await Delegue.findOne({ email });

      if (
        !delegue?.relations?.filter(
          (relation) =>
            relation.etablissement_responsable.siret === siret_responsable &&
            relation.etablissement_formateur.siret === siret_formateur
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
                },
                etablissement_formateur: {
                  siret: formateur?.siret,
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
              {
                "element.etablissement_responsable.siret": siret_responsable,
                "element.etablissement_formateur.siret": siret_formateur,
              },
            ],
          }
        );
      }

      if (previousDelegue) {
        saveDelegationUpdatedByAdmin({ siret_responsable, siret_formateur, email }, req.user);
      } else {
        saveDelegationCreatedByAdmin({ siret_responsable, siret_formateur, email }, req.user);
      }

      const updatedDelegue = await Delegue.findOne({ email });

      if (updatedDelegue.statut === USER_STATUS.EN_ATTENTE) {
        await Delegue.updateOne({ email }, { $set: { statut: USER_STATUS.CONFIRME } });
      }

      await sendActivationEmails({ sendEmail, resendEmail }, { username: email, force: true, sender: req.user });

      logger.info(
        `Délégation activée (${updatedDelegue.email}) pour le formateur ${siret_formateur} et le responsable ${siret_responsable}`
      );

      res.json(updatedDelegue);
    })
  );

  /**
   * Permet à un administrateur de modifier les paramètres de diffusion d'un responsable à un de ses formateurs associés (suppression)
   */
  router.delete(
    "/api/admin/responsables/:siret_responsable/delegation",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const { siret: siret_formateur } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
            // active: true,
          },
        },
      });

      const updateDelegue = await Delegue.updateOne(
        {
          relations: {
            $elemMatch: {
              "etablissement_responsable.siret": siret_responsable,
              "etablissement_formateur.siret": siret_formateur,
              // active: true,
            },
          },
        },
        // {
        //   $set: {
        //     "relations.$[element].active": false,
        //   },
        // },
        {
          $pull: {
            relations: {
              "etablissement_responsable.siret": siret_responsable,
              "etablissement_formateur.siret": siret_formateur,
            },
          },
        }
      );

      await saveDelegationCancelledByAdmin({ siret_formateur, siret_responsable, email: delegue?.email }, req.user);

      logger.info(
        `Délégation désactivée (${delegue?.email}) pour le formateur ${siret_formateur} et le responsable ${siret_responsable}`
      );

      res.json(updateDelegue);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/admin/responsables/:siret_responsable/formateurs/:siret_formateur/voeux",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable, siret_formateur } = await Joi.object({
        siret_formateur: Joi.string().pattern(siretFormat).required(),
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const filename = `${siret_responsable}-${siret_formateur}.csv`;

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(
        getVoeuxStream({ siret_responsable, siret_formateur }),
        transformIntoCSV({ mapper: (v) => `"${v || ""}"` }),
        res
      );
    })
  );

  /**
   * Permet de modifier l'adresse courriel d'un responsable (et envoie un courriel pour confirmation de l'adresse courriel)
   *
   */
  router.put(
    "/api/admin/responsables/:siret_responsable/setEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable, email } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
        email: Joi.string().email().required(),
      }).validateAsync({ ...req.body, ...req.params }, { abortEarly: false });

      const responsable = await Etablissement.findOne({
        siret: siret_responsable,
      });

      await changeEmail(siret_responsable, email, { auteur: req.user.username });

      await saveAccountEmailUpdatedByAdmin({ siret: siret_responsable, email }, responsable.email, req.user);

      await Etablissement.updateOne({ siret: siret_responsable }, { $set: { statut: USER_STATUS.EN_ATTENTE } });

      await sendConfirmationEmails(
        { sendEmail, resendEmail },
        { username: siret_responsable, force: true, sender: req.user }
      );

      res.json({});
    })
  );

  /**
   * Permet de renvoyer un mail de confirmation à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret_responsable/resendConfirmationEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret_responsable);

      const stats = await sendConfirmationEmails(
        { sendEmail, resendEmail },
        { username: siret_responsable, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail d'activation à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret_responsable/resendActivationEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret_responsable);

      const stats = await sendActivationEmails(
        { sendEmail, resendEmail },
        { username: siret_responsable, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail de notification à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret_responsable/resendNotificationEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret_responsable);

      const stats = await sendNotificationEmails(
        { sendEmail, resendEmail },
        { username: siret_responsable, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail de mise à jour à un responsable
   */
  router.put(
    "/api/admin/responsables/:siret_responsable/resendUpdateEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret_responsable);

      const stats = await sendUpdateEmails(
        { sendEmail, resendEmail },
        { username: siret_responsable, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  // /**
  //  * @deprecated
  //  *
  //  * Marque un responsable comme non concerné (permet de ne plus envoyer de courriels à ce responsable)
  //  */
  // router.put(
  //   "/api/admin/responsables/:siret_responsable/markAsNonConcerne",
  //   checkApiToken(),
  //   checkIsAdminOrAcademie(),
  //   tryCatch(async (req, res) => {
  //     const { siret_responsable } = await Joi.object({
  //       siret_responsable: Joi.string().pattern(siretFormat).required(),
  //     }).validateAsync(req.params, { abortEarly: false });

  //     await markAsNonConcerne(siret_responsable);

  //     res.json({ statut: "non concerné" });
  //   })
  // );

  /** DELEGUES
   * =============
   */

  /**
   * Permet de renvoyer un mail d'activation à un délégué
   */
  router.put(
    "/api/admin/delegues/:siret_responsable/:siret_formateur/resendActivationEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable, siret_formateur } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
        siret_formateur: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      await cancelUnsubscription(delegue.username);

      const stats = sendActivationEmails(
        { sendEmail, resendEmail },
        { username: delegue.username, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail de notification à un délégué
   */
  router.put(
    "/api/admin/delegues/:siret_responsable/:siret_formateur/resendNotificationEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable, siret_formateur } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
        siret_formateur: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      await cancelUnsubscription(delegue.username);

      const stats = await sendNotificationEmails(
        { sendEmail, resendEmail },
        { username: delegue.username, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  /**
   * Permet de renvoyer un mail de mise à jour à un délégué
   */
  router.put(
    "/api/admin/delegues/:siret_responsable/:siret_formateur/resendUpdateEmail",
    checkApiToken(),
    checkIsAdminOrAcademie(),
    tryCatch(async (req, res) => {
      const { siret_responsable, siret_formateur } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
        siret_formateur: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      await cancelUnsubscription(delegue.username);

      const stats = await sendUpdateEmails(
        { sendEmail, resendEmail },
        { username: delegue.username, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  return router;
};
