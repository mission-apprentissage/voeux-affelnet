const express = require("express");
const { oleoduc, transformIntoJSON, transformData } = require("oleoduc");
const { sortBy } = require("lodash");
const Joi = require("@hapi/joi");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User, Gestionnaire, Log, Voeu, Formateur } = require("../../common/model");
const { getAcademies } = require("../../common/academies");
const { paginate } = require("../../common/utils/mongooseUtils");
const authMiddleware = require("../middlewares/authMiddleware");
const exportGestionnaires = require("../../jobs/exportGestionnaires");
const { exportEtablissementsInconnus } = require("../../jobs/exportEtablissementsInconnus.js");
const { exportStatutVoeux } = require("../../jobs/exportStatutVoeux.js");
const { exportVoeuxRecensement } = require("../../jobs/exportVoeuxRecensement.js");
const resendConfirmationEmails = require("../../jobs/resendConfirmationEmails");
const resendActivationEmails = require("../../jobs/resendActivationEmails");
const resendNotificationEmails = require("../../jobs/resendNotificationEmails");
const { changeEmail } = require("../../common/actions/changeEmail");
const { markAsNonConcerne } = require("../../common/actions/markAsNonConcerne");
const { cancelUnsubscription } = require("../../common/actions/cancelUnsubscription");
const { dateAsString } = require("../../common/utils/stringUtils.js");
const { siretFormat, uaiFormat } = require("../../common/utils/format");
const { UserStatut } = require("../../common/constants/UserStatut");
const sendConfirmationEmails = require("../../jobs/sendConfirmationEmails");

module.exports = ({ sendEmail, resendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, checkIsAdmin } = authMiddleware();

  function asCsvResponse(name, res) {
    const now = dateAsString(new Date());
    res.setHeader("Content-disposition", `attachment; filename=${name}-${now}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    return res;
  }

  /**
   * USERS (GESTIONNAIRES & FORMATEURS)
   */
  /**
   * Permet de récupérer la liste des formateurs
   */
  router.get(
    "/api/admin/users",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { text, type, page, items_par_page, sort } = await Joi.object({
        text: Joi.string(),
        type: Joi.string(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
        sort: Joi.string().default(`{ "username": 1 }`),
      }).validateAsync(req.query, { abortEarly: false });

      const regex = ".*" + text?.trim() + ".*";
      const regexQuery = { $regex: regex, $options: "i" };
      const { find, pagination } = await paginate(
        User,
        {
          // $or: [{ type: "Formateur" }, { type: "Gestionnaire" }],
          // type: "Gestionnaire",
          // ...(text ? { $text: { $search: `"${text.trim()}"` } } : {}),
          $and: [
            {
              ...(type ? { type } : {}),
            },
            {
              $or: [
                {
                  type: "Formateur",
                  ...(text
                    ? {
                        $or: [{ uai: regexQuery }, { raison_sociale: regexQuery }],
                      }
                    : {}),
                },
                {
                  type: "Gestionnaire",
                  ...(text
                    ? {
                        $or: [{ siret: regexQuery }, { raison_sociale: regexQuery }],
                      }
                    : {}),
                },
              ],
            },
          ],
        },
        {
          page,
          items_par_page,
          select: { _id: 0, password: 0 },
        }
      );

      const stream = oleoduc(
        find.sort(JSON.parse(sort ?? "{}")).cursor(),
        transformData(async (user) => {
          return {
            ...user,

            ...(user.type === "Gestionnaire"
              ? {
                  nombre_voeux: await Voeu.countDocuments({ "etablissement_gestionnaire.siret": user.siret }),
                  formateurs: await Formateur.find({
                    uai: { $in: user.etablissements.map((etablissement) => etablissement.uai) },
                  }),
                }
              : {
                  nombre_voeux: await Voeu.countDocuments({ "etablissement_accueil.uai": user.uai }),
                  gestionnaires: await Gestionnaire.find({
                    siret: { $in: user.etablissements.map((etablissement) => etablissement.siret) },
                  }),
                }),
          };
        }),
        transformIntoJSON({
          arrayWrapper: {
            pagination,
          },
          arrayPropertyName: "users",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  /**
   * GESTIONNAIRES
   * =============
   */

  /**
   * Permet de récupérer la liste des gestionnaires
   */
  router.get(
    "/api/admin/gestionnaires",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { text, page, items_par_page } = await Joi.object({
        text: Joi.string(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
      }).validateAsync(req.query, { abortEarly: false });

      const { find, pagination } = await paginate(
        Gestionnaire,
        {
          ...(text ? { $text: { $search: `"${text.trim()}"` } } : {}),
          type: "Gestionnaire",
        },
        {
          page,
          items_par_page,
          select: { _id: 0, password: 0 },
        }
      );

      const stream = oleoduc(
        find.sort({ siret: 1 }).cursor(),
        // transformData(async (gestionnaire) => {
        //   return {
        //     ...gestionnaire,
        //     etablissements: await Promise.all(async (etablissement) => {
        //       const voeuxFilter = {
        //         "etablissement_accueil.uai": etablissement.uai,
        //         "etablissement_gestionnaire.siret": gestionnaire.siret,
        //       };

        //       const voeux = await Voeu.find(voeuxFilter);

        //       return {
        //         ...etablissement,
        //         nombre_voeux: etablissement.uai ? await Voeu.countDocuments(voeuxFilter).lean() : 0,

        //         first_date_voeux: etablissement.uai
        //           ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
        //           : null,

        //         last_date_voeux: etablissement.uai
        //           ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
        //           : null,
        //       };
        //     }),
        //   };
        // }),
        transformIntoJSON({
          arrayWrapper: {
            pagination,
          },
          arrayPropertyName: "gestionnaires",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  router.get(
    "/api/admin/gestionnaires/:siret",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      const voeuxFilter = {
        "etablissement_gestionnaire.siret": gestionnaire.siret,
      };

      res.json({
        ...gestionnaire,
        nombre_voeux: await Voeu.countDocuments(voeuxFilter).lean(),

        etablissements: await Promise.all(
          gestionnaire.etablissements.map(async (etablissement) => {
            const voeuxFilter = {
              "etablissement_accueil.uai": etablissement.uai,
              "etablissement_gestionnaire.siret": gestionnaire.siret,
            };

            const voeux = await Voeu.find(voeuxFilter);

            return {
              ...etablissement,
              nombre_voeux: etablissement.uai ? await Voeu.countDocuments(voeuxFilter).lean() : 0,

              first_date_voeux: etablissement.uai
                ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
                : null,

              last_date_voeux: etablissement.uai
                ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
                : null,
            };
          })
        ),
      });
    })
  );

  router.get(
    "/api/admin/gestionnaires/:siret/formateurs",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const gestionnaire = await Gestionnaire.findOne({ siret });

      if (!gestionnaire.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          gestionnaire.etablissements.map(async (etablissement) => {
            const formateur = await Formateur.findOne({ uai: etablissement.uai });

            return formateur;
          })
        )
      );
    })
  );

  router.put(
    "/api/admin/gestionnaires/:siret/setEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, email } = await Joi.object({
        siret: Joi.string().required(),
        email: Joi.string().email().required(),
      }).validateAsync({ ...req.body, ...req.params }, { abortEarly: false });

      await changeEmail(siret, email, { auteur: req.user.username });

      const gestionnaire = await Gestionnaire.findOne({ siret });
      await Gestionnaire.updateOne({ siret }, { $set: { statut: UserStatut.EN_ATTENTE } });
      const previousConfirmationEmail = gestionnaire.emails.find((e) => e.templateName.startsWith("confirmation_"));

      previousConfirmationEmail
        ? await resendConfirmationEmails(resendEmail, { username: siret, force: true })
        : await sendConfirmationEmails(sendEmail, { username: siret });

      return res.json({});
    })
  );

  router.put(
    "/api/admin/gestionnaires/:siret/resendConfirmationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret);
      const stats = await resendConfirmationEmails(resendEmail, { username: siret });

      return res.json(stats);
    })
  );

  router.put(
    "/api/admin/gestionnaires/:siret/resendActivationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret);
      const stats = await resendActivationEmails(resendEmail, { username: siret });

      return res.json(stats);
    })
  );

  router.put(
    "/api/admin/gestionnaires/:siret/resendNotificationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cancelUnsubscription(siret);
      const stats = await resendNotificationEmails(resendEmail, { username: siret, force: true });

      return res.json(stats);
    })
  );

  router.put(
    "/api/admin/gestionnaires/:siret/markAsNonConcerne",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret } = await Joi.object({
        siret: Joi.string().required(),
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
   * Permet de récupérer la liste des formateurs
   */
  router.get(
    "/api/admin/formateurs",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { text, page, items_par_page } = await Joi.object({
        text: Joi.string(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
      }).validateAsync(req.query, { abortEarly: false });

      const { find, pagination } = await paginate(
        Formateur,
        {
          ...(text ? { $text: { $search: `"${text.trim()}"` } } : {}),
          type: "Formateur",
        },
        {
          page,
          items_par_page,
          select: { _id: 0, password: 0 },
        }
      );

      const stream = oleoduc(
        find.sort({ siret: 1 }).cursor(),
        transformIntoJSON({
          arrayWrapper: {
            pagination,
          },
          arrayPropertyName: "formateurs",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  router.get(
    "/api/admin/formateurs/:uai",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const formateur = await Formateur.findOne({ uai });

      res.json(formateur);
    })
  );

  router.get(
    "/api/admin/formateurs/:uai/gestionnaires",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const formateur = await Formateur.findOne({ uai });

      if (!formateur.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          formateur.etablissements.map(async (etablissement) => {
            const gestionnaire = await Gestionnaire.findOne({ siret: etablissement.siret });

            return gestionnaire;
          })
        )
      );
    })
  );

  /**
   * FICHIERS
   * =============
   */

  router.get(
    "/api/admin/fichiers/injoinables.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportGestionnaires(asCsvResponse("gestionnaires-injoinables", res), {
        filter: { $or: [{ "emails.error": { $exists: true } }, { unsubscribe: true }] },
      });
    })
  );

  router.get(
    "/api/admin/fichiers/relances.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportGestionnaires(asCsvResponse("gestionnaires-relances", res), {
        filter: { statut: { $in: ["en attente", "confirmé"] }, "etablissements.voeux_date": { $exists: true } },
        columns: {
          statut: (data) => data.statut,
          nb_voeux: async (data) => {
            const count = await Voeu.countDocuments({
              "etablissement_accueil.uai": { $in: data.etablissements.map((e) => e.uai) },
            });
            return count ? count : "0";
          },
        },
      });
    })
  );

  router.get(
    "/api/admin/fichiers/inconnus.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportEtablissementsInconnus(asCsvResponse("etablissements-inconnus", res));
    })
  );

  router.get(
    "/api/admin/fichiers/statut-voeux.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportStatutVoeux(asCsvResponse("statut-voeux", res));
    })
  );

  router.get(
    "/api/admin/fichiers/voeux-recensement.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportVoeuxRecensement(asCsvResponse("voeux-recensement", res));
    })
  );

  /**
   * ACADEMIES
   * =============
   */

  router.get(
    "/api/admin/academies",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const results = await Log.aggregate([
        {
          $match: {
            "request.url.path": "/api/stats/computeStats/now",
            "request.url.parameters.academies": { $exists: true },
          },
        },
        {
          $group: {
            _id: "$request.url.parameters.academies",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json(
        sortBy(getAcademies(), (a) => a.nom).map((academie) => {
          const found = results.find((r) => r._id === academie.code) || {};
          return {
            code: academie.code,
            nom: academie.nom,
            nbConsultationStats: found.count || 0,
          };
        })
      );
    })
  );

  return router;
};
