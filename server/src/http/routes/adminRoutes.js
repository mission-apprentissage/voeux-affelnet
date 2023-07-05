const express = require("express");
const { oleoduc, transformIntoJSON, transformData, compose, transformIntoCSV } = require("oleoduc");
const Joi = require("@hapi/joi");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User, Gestionnaire, /*Log,*/ Voeu, Formateur } = require("../../common/model");
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
const { fillFormateur, filterForAcademie, fillGestionnaire } = require("../../common/utils/dataUtils");

module.exports = ({ sendEmail, resendEmail }) => {
  const router = express.Router();
  const { checkApiToken, checkIsAdmin } = authMiddleware();

  function asCsvResponse(name, res) {
    const now = dateAsString(new Date());
    res.setHeader("Content-disposition", `attachment; filename=${name}-${now}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    return res;
  }

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
   * USERS (GESTIONNAIRES & FORMATEURS)
   */

  /**
   * Permet de récupérer la liste des utilisateurs
   */
  router.get(
    "/api/admin/users",
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

      // const academies = academie ? [academie] : defaultAcademies?.length ? defaultAcademies : null;

      // const data = await User.aggregate([
      //   {
      //     $match: {
      //       $or: [
      //         {
      //           type: "Gestionnaire",

      //           ...(academie || !!defaultAcademies?.length
      //             ? {
      //                 $or: [
      //                   { "academie.code": { $in: academie ? [academie] : defaultAcademies } },
      //                   {
      //                     etablissements: {
      //                       $elemMatch: { "academie.code": { $in: academie ? [academie] : defaultAcademies } },
      //                     },
      //                   },
      //                 ],
      //               }
      //             : {}),
      //         },
      //         // {
      //         //   type: "Formateur",

      //         //   ...(academie || !!defaultAcademies?.length
      //         //     ? [
      //         //         {
      //         //           $or: [{ "academie.code": { $in: academie ? [academie] : defaultAcademies } }],
      //         //         },
      //         //       ]
      //         //     : []),
      //         // },
      //       ],
      //     },
      //   },
      //   ...(academies
      //     ? [
      //         {
      //           $addFields: {
      //             etablissements: {
      //               $filter: {
      //                 input: "$etablissements",
      //                 as: "etablissement",
      //                 cond: { $in: ["$$etablissement.academie.code", academies] },
      //               },
      //             },
      //           },
      //         },
      //       ]
      //     : []),

      //   {
      //     $unwind: {
      //       path: "$etablissements",
      //       preserveNullAndEmptyArrays: false,
      //     },
      //   },
      // ]);

      // const stats = {
      //   organisme_count: data.length,

      //   organisme_count_downloaded: data.filter(async (data) => {
      //     const formateur = await getFormateur(data.etablissements?.uai, admin);
      //     const gestionnaire = await getGestionnaire(data.siret, admin);

      //     const etablissementFromGestionnaire = gestionnaire?.etablissements.find(
      //       (etablissement) => etablissement.uai === formateur?.uai
      //     );

      //     const etablissementFromFormateur = formateur?.etablissements.find(
      //       (etablissement) => etablissement.siret === gestionnaire?.siret
      //     );

      //     const telechargementsByGestionnaire = gestionnaire?.voeux_telechargements.filter(
      //       (voeux_telechargement) => voeux_telechargement.uai === formateur?.uai
      //     );

      //     const lastVoeuxTelechargementDateByGestionnaire = new Date(
      //       telechargementsByGestionnaire[telechargementsByGestionnaire.length - 1]?.date
      //     );

      //     const telechargementsByFormateur = formateur?.voeux_telechargements.filter(
      //       (voeux_telechargement) => voeux_telechargement.siret === gestionnaire?.siret
      //     );

      //     const lastVoeuxTelechargementDateByFormateur = new Date(
      //       telechargementsByFormateur[telechargementsByFormateur.length - 1]?.date
      //     );

      //     return etablissementFromGestionnaire.diffusionAutorisee
      //       ? lastVoeuxTelechargementDateByFormateur.getTime() >
      //           new Date(etablissementFromGestionnaire.voeux_date).getTime()
      //       : lastVoeuxTelechargementDateByGestionnaire.getTime() >
      //           new Date(etablissementFromGestionnaire.voeux_date).getTime();
      //   }).length,
      //   // organisme_count_partially_downloaded: await Formateur.countDocuments({
      //   //   ...(academie || !!defaultAcademies?.length
      //   //     ? [
      //   //         {
      //   //           $or: [{ "academie.code": { $in: academie ? [academie] : defaultAcademies } }],
      //   //         },
      //   //       ]
      //   //     : []),

      //   //   voeux_telechargements: {
      //   //     $elemMatch: {
      //   //       $exists: true,
      //   //       siret: "$etablissements.siret",
      //   //       date: { $gt: "$etablissements.voeux_date" },
      //   //     },
      //   //   },
      //   // }),
      //   // organisme_count_not_downloaded: await Formateur.countDocuments({
      //   //   ...(academie || !!defaultAcademies?.length
      //   //     ? [
      //   //         {
      //   //           $or: [{ "academie.code": { $in: academie ? [academie] : defaultAcademies } }],
      //   //         },
      //   //       ]
      //   //     : []),

      //   //   voeux_telechargements: {
      //   //     $exists: false,
      //   //   },
      //   //   "etablissements.voeux_date": {
      //   //     $exists: false,
      //   //   },
      //   // }),
      // };

      const { find, pagination } = await paginate(
        User,
        {
          // ...(text ?  $text: { $search: `"${text.trim()}"` } } : {}),
          $and: [
            ...(type ? [{ type }] : []),

            {
              $or: [
                {
                  type: "Formateur",
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
                                etablissements: {
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
                  type: "Gestionnaire",
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
                                etablissements: {
                                  $elemMatch: { uai: regexQuery },
                                },
                              },
                              {
                                etablissements: {
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
                                etablissements: {
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
            ...(user.type === UserType.GESTIONNAIRE
              ? {
                  ...(await fillGestionnaire(user, admin)),

                  formateurs: await Promise.all(
                    (
                      await Formateur.find({
                        uai: {
                          $in:
                            user?.etablissements
                              .filter((etablissement) => filterForAcademie(etablissement, admin))
                              .map((etablissement) => etablissement.uai) ?? [],
                        },
                      }).lean()
                    ).map((etablissement) => fillFormateur(etablissement, admin))
                  ),
                }
              : {
                  ...(await fillFormateur(user, admin)),

                  gestionnaires: await Promise.all(
                    (
                      await Gestionnaire.find({
                        siret: {
                          $in:
                            user?.etablissements
                              // .filter((etablissement) => filterForAcademie(etablissement, admin))
                              .map((etablissement) => etablissement.siret) ?? [],
                        },
                      }).lean()
                    ).map((gestionnaire) => fillGestionnaire(gestionnaire, admin))
                  ),
                }),
          };
        }),
        transformIntoJSON({
          arrayWrapper: {
            // stats,
            pagination,
          },
          arrayPropertyName: "users",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  router.get(
    "/api/admin/users/export.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();
      const defaultAcademies = admin?.academies?.map((academie) => academie.code);

      const { academie /*, text*/ } = await Joi.object({
        academie: Joi.string().valid(...[...getAcademies().map((academie) => academie.code)]),
        // text: Joi.string(),
        token: Joi.string(),
      }).validateAsync(req.query, { abortEarly: false });

      // return sendJsonStream(stream, res);
      return download(asCsvResponse("export", res), {
        academies: academie ? [academie] : defaultAcademies?.length ? defaultAcademies : null,
        admin,
      });
    })
  );

  /**
   * GESTIONNAIRES
   * =============
   */

  router.get(
    "/api/admin/gestionnaires/:siret",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      res.json(await fillGestionnaire(gestionnaire, admin));
    })
  );

  router.get(
    "/api/admin/gestionnaires/:siret/formateurs",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const gestionnaire = await Gestionnaire.findOne({ siret });

      if (
        !gestionnaire?.etablissements
          .filter((etablissement) => filterForAcademie(etablissement, admin))
          .filter((e) => e.voeux_date).length === 0
      ) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          gestionnaire?.etablissements
            .filter((etablissement) => filterForAcademie(etablissement, admin))
            .map(async (etablissement) => {
              const formateur = await Formateur.findOne({ uai: etablissement.uai }).lean();

              return {
                ...formateur,

                etablissements: await Promise.all(
                  formateur?.etablissements
                    .filter((etablissement) => filterForAcademie(etablissement, admin))
                    .map(async (etablissement) => {
                      const voeuxFilter = {
                        "etablissement_formateur.uai": formateur.uai,
                        "etablissement_gestionnaire.siret": etablissement.siret,
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
   * Permet au gestionnaire de modifier les paramètres de diffusion à un de ses formateurs associés
   */
  router.put(
    "/api/admin/gestionnaires/:siret/formateurs/:uai",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, uai } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      if (!gestionnaire?.etablissements.filter((etablissements) => etablissements.uai === uai).length === 0) {
        throw Error("L'UAI n'est pas dans la liste des établissements formateurs liés à votre gestionnaire.");
      }

      const etablissement = gestionnaire?.etablissements.find((e) => e.uai === uai);

      const etablissements = gestionnaire?.etablissements.map((etablissement) => {
        if (etablissement.uai === uai) {
          typeof req.body.email !== "undefined" && (etablissement.email = req.body.email);
          typeof req.body.diffusionAutorisee !== "undefined" &&
            (etablissement.diffusionAutorisee = req.body.diffusionAutorisee);
        }
        return etablissement;
      });

      await Gestionnaire.updateOne({ siret: gestionnaire.siret }, { etablissements });

      const formateur = await Formateur.findOne({ uai }).lean();

      if (typeof req.body.email !== "undefined" && req.body.diffusionAutorisee === true) {
        etablissement?.diffusionAutorisee
          ? await saveDelegationUpdatedByAdmin({ ...formateur, email: req.body.email }, req.user)
          : await saveDelegationCreatedByAdmin({ ...formateur, email: req.body.email }, req.user);

        await Formateur.updateOne(
          { uai },
          { $set: { statut: UserStatut.CONFIRME, email: req.body.email, password: null } }
        );
        const previousActivationEmail = formateur.emails.find((e) => e.templateName.startsWith("activation_"));

        previousActivationEmail
          ? await resendActivationEmails(resendEmail, { username: uai, force: true, sender: req.user })
          : await sendActivationEmails(sendEmail, { username: uai, force: true, sender: req.user });
      } else if (req.body.diffusionAutorisee === false) {
        await saveDelegationCancelledByAdmin({ ...formateur, email: formateur.email ?? etablissement.email }, req.user);
      }

      const updatedGestionnaire = await Gestionnaire.findOne({ siret: gestionnaire.siret });

      res.json(updatedGestionnaire);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/admin/gestionnaires/:siret/formateurs/:uai/voeux",
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
    "/api/admin/gestionnaires/:siret/setEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, email } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        email: Joi.string().email().required(),
      }).validateAsync({ ...req.body, ...req.params }, { abortEarly: false });

      const gestionnaire = await Gestionnaire.findOne({ siret });

      await changeEmail(siret, email, { auteur: req.user.username });

      await saveAccountEmailUpdatedByAdmin({ siret, email }, gestionnaire.email, req.user);

      await Gestionnaire.updateOne({ siret }, { $set: { statut: UserStatut.EN_ATTENTE } });
      const previousConfirmationEmail = gestionnaire.emails.find((e) => e.templateName.startsWith("confirmation_"));

      previousConfirmationEmail
        ? await resendConfirmationEmails(resendEmail, { username: siret, force: true, sender: req.user })
        : await sendConfirmationEmails(sendEmail, { username: siret, sender: req.user });

      return res.json({});
    })
  );

  router.put(
    "/api/admin/gestionnaires/:siret/resendConfirmationEmail",
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
    "/api/admin/gestionnaires/:siret/resendActivationEmail",
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
    "/api/admin/gestionnaires/:siret/resendNotificationEmail",
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
    "/api/admin/gestionnaires/:siret/markAsNonConcerne",
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

      res.json(await fillFormateur(formateur, admin));
    })
  );

  router.get(
    "/api/admin/formateurs/:uai/gestionnaires",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { username } = req.user;
      const admin = await User.findOne({ username }).lean();

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const formateur = await Formateur.findOne({ uai });

      res.json(
        await Promise.all(
          formateur?.etablissements.map(async (etablissement) => {
            const gestionnaire = await Gestionnaire.findOne({ siret: etablissement.siret }).lean();

            return await fillGestionnaire(gestionnaire, admin);
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
