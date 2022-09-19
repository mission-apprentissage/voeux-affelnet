const express = require("express");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const { sortBy } = require("lodash");
const Joi = require("@hapi/joi");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Cfa, Log, Voeu } = require("../../common/model");
const { getAcademies } = require("../../common/academies");
const { paginate } = require("../../common/utils/mongooseUtils");
const authMiddleware = require("../middlewares/authMiddleware");
const exportCfas = require("../../jobs/exportCfas");
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

module.exports = ({ resendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, checkIsAdmin } = authMiddleware();

  function asCsvResponse(name, res) {
    const now = dateAsString(new Date());
    res.setHeader("Content-disposition", `attachment; filename=${name}-${now}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    return res;
  }

  router.get(
    "/api/admin/cfas",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { text, page, items_par_page } = await Joi.object({
        text: Joi.string(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
      }).validateAsync(req.query, { abortEarly: false });

      const { find, pagination } = await paginate(
        Cfa,
        {
          ...(text ? { $text: { $search: `"${text.trim()}"` } } : {}),
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
          arrayPropertyName: "cfas",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  router.put(
    "/api/admin/cfas/:siret/setEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { siret, email } = await Joi.object({
        siret: Joi.string().required(),
        email: Joi.string().email().required(),
      }).validateAsync({ ...req.body, ...req.params }, { abortEarly: false });

      await changeEmail(siret, email, { auteur: req.user.username });

      return res.json({});
    })
  );

  router.put(
    "/api/admin/cfas/:siret/resendConfirmationEmail",
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
    "/api/admin/cfas/:siret/resendActivationEmail",
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
    "/api/admin/cfas/:siret/resendNotificationEmail",
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
    "/api/admin/cfas/:uai/markAsNonConcerne",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await markAsNonConcerne(uai);

      return res.json({ statut: "non concerné" });
    })
  );

  router.get(
    "/api/admin/cfas/injoinables.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportCfas(asCsvResponse("cfas-injoinables", res), {
        filter: { $or: [{ "emails.error": { $exists: true } }, { unsubscribe: true }] },
      });
    })
  );

  router.get(
    "/api/admin/cfas/relances.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportCfas(asCsvResponse("cfas-relances", res), {
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
    "/api/admin/etablissements/inconnus.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportEtablissementsInconnus(asCsvResponse("etablissements-inconnus", res));
    })
  );

  router.get(
    "/api/admin/etablissements/statut-voeux.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportStatutVoeux(asCsvResponse("statut-voeux", res));
    })
  );

  router.get(
    "/api/admin/etablissements/voeux-recensement.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      return exportVoeuxRecensement(asCsvResponse("voeux-recensement", res));
    })
  );

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
