const express = require("express");
const { oleoduc, transformIntoJSON, transformData, compose, transformIntoCSV } = require("oleoduc");
const Joi = require("@hapi/joi");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User, Formateur, Responsable, /*Etablissement,*/ /*Log,*/ Voeu } = require("../../common/model");
const { getAcademies } = require("../../common/academies");
const { paginate } = require("../../common/utils/mongooseUtils");
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
const { saveDelegationCreatedByAdmin } = require("../../common/actions/history/formateur");
const { saveDelegationUpdatedByAdmin } = require("../../common/actions/history/formateur");
const { saveDelegationCancelledByAdmin } = require("../../common/actions/history/formateur");
const { UserType } = require("../../common/constants/UserType");
const { download } = require("../../jobs/download");
const { fillFormateur, filterForAcademie, fillResponsable } = require("../../common/utils/dataUtils");

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

      const regex = ".*" + text + ".*";
      const regexQuery = { $regex: regex, $options: "i" };

      const { find, pagination } = await paginate(
        User,
        {
          $and: [
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

            {
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
                              {
                                etablissements_responsable: {
                                  $elemMatch: { siret: regexQuery },
                                },
                              },
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
                              {
                                etablissements_formateur: {
                                  $elemMatch: { uai: regexQuery },
                                },
                              },
                              {
                                etablissements_formateur: {
                                  $elemMatch: { email: regexQuery },
                                },
                              },
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
                                etablissements_formateur: {
                                  $elemMatch: { "academie.code": { $in: academie ? [academie] : defaultAcademies } },
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
          ],
        },
        {
          page,
          items_par_page,
          select: { _id: 0, password: 0 },
          sort: JSON.parse(sort ?? JSON.stringify({ type: -1 })),
        }
      );

      const stream = oleoduc(
        find.cursor(),
        transformData(async (user) => {
          return {
            ...(user.type === UserType.RESPONSABLE && {
              // ...(!!user.etablissements_formateur?.length && {
              ...(await fillResponsable(user, admin)),

              formateurs: await Promise.all(
                (
                  await Formateur.find({
                    // await Etablissement.find({
                    //   ...formateurFilter,
                    uai: {
                      $in:
                        user?.etablissements_formateur
                          .filter((etablissement) => filterForAcademie(etablissement, admin))
                          .map((etablissement) => etablissement.uai) ?? [],
                    },
                  }).lean()
                ).map((etablissement) => fillFormateur(etablissement, admin))
              ),
            }),
            ...(user.type === UserType.FORMATEUR && {
              // ...(!!user.etablissements_responsable?.length && {
              ...(await fillFormateur(user, admin)),

              responsables: await Promise.all(
                (
                  await Responsable.find({
                    // await Etablissement.find({
                    //   ...responsableFilter,
                    siret: {
                      $in:
                        user?.etablissements_responsable
                          // .filter((etablissement) => filterForAcademie(etablissement, admin))
                          .map((etablissement) => etablissement.siret) ?? [],
                    },
                  }).lean()
                ).map((responsable) => fillResponsable(responsable, admin))
              ),
            }),
          };
        }),
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

  router.get(
    "/api/admin/responsables/:siret",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const responsable = await Responsable.findOne({
        siret,
      }).lean();

      // const responsable = await Etablissement.findOne({
      //   ...responsableFilter,
      //   siret,
      // }).lean();

      res.json(await fillResponsable(responsable, admin));
    })
  );

  router.get(
    "/api/admin/responsables/:siret/formateurs",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const responsable = await Responsable.findOne({
        siret,
      });

      // const responsable = await Etablissement.findOne({
      //   ...responsableFilter,
      //   siret,
      // });

      if (
        !responsable?.etablissements_formateur
          .filter((etablissement) => filterForAcademie(etablissement, admin))
          .filter((e) => e.voeux_date).length === 0
      ) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          responsable?.etablissements_formateur
            .filter((etablissement) => filterForAcademie(etablissement, admin))
            .map(async (etablissement) => {
              const formateur = await Formateur.findOne({
                uai: etablissement.uai,
              }).lean();
              // const formateur = await Etablissement.findOne({
              //   ...formateurFilter,
              //   uai: etablissement.uai,
              // }).lean();

              return {
                ...formateur,

                etablissements: await Promise.all(
                  formateur?.etablissements_responsable
                    .filter((etablissement) => filterForAcademie(etablissement, admin))
                    .map(async (etablissement) => {
                      const voeuxFilter = {
                        "etablissement_formateur.uai": formateur.uai,
                        "etablissement_responsable.siret": etablissement.siret,
                      };

                      const voeux = await Voeu.find(voeuxFilter);

                      return {
                        ...etablissement,

                        nombre_voeux: etablissement.siret ? await Voeu.countDocuments(voeuxFilter).lean() : 0,

                        first_date_voeux: etablissement.siret
                          ? voeux
                              .flatMap((voeu) => voeu._meta.import_dates)
                              .sort((a, b) => new Date(a) - new Date(b))[0]
                          : null,

                        last_date_voeux: etablissement.voeux_date /*etablissement.siret
                        ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
                        : null*/,
                      };
                    }) ?? []
                ),
              };
            })
        )
      );
    })
  );

  /**
   * Permet au responsable de modifier les paramètres de diffusion à un de ses formateurs associés
   */
  router.put(
    "/api/admin/responsables/:siret/formateurs/:uai",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, uai } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const responsable = await Responsable.findOne({
        siret,
      }).lean();

      // const responsable = await Etablissement.findOne({
      //   ...responsableFilter,
      //   siret,
      // }).lean();

      if (!responsable?.etablissements_formateur.filter((etablissements) => etablissements.uai === uai).length === 0) {
        throw Error("L'UAI n'est pas dans la liste des établissements formateurs liés à votre responsable.");
      }

      const etablissement = responsable?.etablissements_formateur.find((e) => e.uai === uai);

      const etablissements = responsable?.etablissements_formateur.map((etablissement) => {
        if (etablissement.uai === uai) {
          typeof req.body.email !== "undefined" && (etablissement.email = req.body.email);
          typeof req.body.diffusionAutorisee !== "undefined" &&
            (etablissement.diffusionAutorisee = req.body.diffusionAutorisee);
        }
        return etablissement;
      });

      await Responsable.updateOne({ siret: responsable.siret }, { etablissements_formateur: etablissements });
      // await Etablissement.updateOne(
      //   { ...responsableFilter, siret: responsable.siret },
      //   { etablissements_formateur: etablissements }
      // );

      const formateur = await Formateur.findOne({
        uai,
      }).lean();

      // const formateur = await Etablissement.findOne({
      //   ...formateurFilter,
      //   uai,
      // }).lean();

      if (typeof req.body.email !== "undefined" && req.body.diffusionAutorisee === true) {
        etablissement?.diffusionAutorisee
          ? await saveDelegationUpdatedByAdmin({ ...formateur, email: req.body.email }, req.user)
          : await saveDelegationCreatedByAdmin({ ...formateur, email: req.body.email }, req.user);

        await Formateur.updateOne(
          { uai },
          { $set: { statut: UserStatut.CONFIRME, email: req.body.email, password: null } }
        );
        // await Etablissement.updateOne(
        //   { ...formateurFilter, uai },
        //   { $set: { statut: UserStatut.CONFIRME, email: req.body.email, password: null } }
        // );
        const previousActivationEmail = formateur.emails.find((e) => e.templateName.startsWith("activation_"));

        previousActivationEmail
          ? await resendActivationEmails(resendEmail, { username: uai, force: true, sender: req.user })
          : await sendActivationEmails(sendEmail, { username: uai, force: true, sender: req.user });
      } else if (req.body.diffusionAutorisee === false) {
        await saveDelegationCancelledByAdmin({ ...formateur, email: formateur.email ?? etablissement.email }, req.user);
      }

      const updatedResponsable = await Responsable.findOne({
        siret: responsable.siret,
      }).lean();

      // const updatedResponsable = await Etablissement.findOne({
      //   ...responsableFilter,
      //   siret: responsable.siret,
      // }).lean();
      res.json(updatedResponsable);
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

  router.get(
    "/api/admin/formateurs/:uai",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const formateur = await Formateur.findOne({ uai }).lean();
      // const formateur = await Etablissement.findOne({ ...formateurFilter, uai }).lean();

      res.json(await fillFormateur(formateur, admin));
    })
  );

  router.get(
    "/api/admin/formateurs/:uai/responsables",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const formateur = await Formateur.findOne({ uai });
      // const formateur = await Etablissement.findOne({ ...formateurFilter, uai });

      res.json(
        await Promise.all(
          formateur?.etablissements_responsable.map(async (etablissement) => {
            const responsable = await Responsable.findOne({
              siret: etablissement.siret,
            }).lean();

            // const responsable = await Etablissement.findOne({
            //   ...responsableFilter,
            //   siret: etablissement.siret,
            // }).lean();

            return await fillResponsable(responsable, admin);
          })
        )
      );
    })
  );

  router.put(
    "/api/admin/formateurs/:uai/resendActivationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(uai);
      const stats = await resendActivationEmails(resendEmail, { username: uai, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  router.put(
    "/api/admin/formateurs/:uai/resendNotificationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(uai);
      const stats = await resendNotificationEmails(resendEmail, { username: uai, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  return router;
};
