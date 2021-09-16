const express = require("express");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const { DateTime } = require("luxon");
const { sortBy } = require("lodash");
const Joi = require("@hapi/joi");
const { sendJsonStream } = require("../utils/httpUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Cfa, Log, Voeu } = require("../../common/model");
const { getAcademies } = require("../../common/academies");
const { paginate } = require("../../common/utils/mongooseUtils");
const authMiddleware = require("../middlewares/authMiddleware");
const exportCfas = require("../../jobs/exportCfas");
const exportCfasInconnus = require("../../jobs/exportCfasInconnus");
const resendConfirmationEmails = require("../../jobs/resendConfirmationEmails");
const resendActivationEmails = require("../../jobs/resendActivationEmails");

module.exports = ({ users, cfas, emails }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, checkIsAdmin } = authMiddleware(users);

  function asCsvResponse(name, res) {
    let date = DateTime.local().setLocale("fr").toFormat("yyyy-MM-dd");
    res.setHeader("Content-disposition", `attachment; filename=${name}-${date}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    return res;
  }

  router.get(
    "/api/admin/cfas",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      let { text, page, items_par_page } = await Joi.object({
        text: Joi.string(),
        page: Joi.number().default(1),
        items_par_page: Joi.number().default(10),
      }).validateAsync(req.query, { abortEarly: false });

      let { find, pagination } = await paginate(
        Cfa,
        {
          ...(text ? { $text: { $search: `"${text.trim()}"` } } : {}),
        },
        {
          page,
          items_par_page,
          projection: { _id: 0, password: 0 },
        }
      );

      let stream = oleoduc(
        find.sort({ uai: 1 }).cursor(),
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
    "/api/admin/cfas/:uai/setEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      let { uai, email } = await Joi.object({
        uai: Joi.string().required(),
        email: Joi.string().email().required(),
      }).validateAsync({ ...req.body, ...req.params }, { abortEarly: false });

      await cfas.changeEmail(uai, email);

      return res.json({});
    })
  );

  router.put(
    "/api/admin/cfas/:uai/resendConfirmationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      let { uai } = await Joi.object({
        uai: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cfas.cancelUnsubscription(uai);
      let stats = await resendConfirmationEmails(emails, { uai });

      return res.json(stats);
    })
  );

  router.put(
    "/api/admin/cfas/:uai/resendActivationEmail",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      let { uai } = await Joi.object({
        uai: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cfas.cancelUnsubscription(uai);
      let stats = await resendActivationEmails(emails, { username: uai });

      return res.json(stats);
    })
  );

  router.put(
    "/api/admin/cfas/:uai/markAsNonConcerne",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      let { uai } = await Joi.object({
        uai: Joi.string().required(),
      }).validateAsync(req.params, { abortEarly: false });

      await cfas.markAsNonConcerne(uai);

      return res.json({ statut: "non concerné" });
    })
  );

  router.get(
    "/api/admin/cfas/injoinables.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      exportCfas(asCsvResponse("cfas-injoinables", res), {
        filter: { $or: [{ "emails.error": { $exists: true } }, { unsubscribe: true }] },
      });
    })
  );

  router.get(
    "/api/admin/cfas/inconnus.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      exportCfasInconnus(asCsvResponse("cfas-inconnus", res));
    })
  );

  router.get(
    "/api/admin/cfas/relances.csv",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      exportCfas(asCsvResponse("cfas-relances", res), {
        filter: { statut: { $in: ["en attente", "confirmé"] }, voeux_date: { $exists: true } },
        columns: {
          statut: (data) => data.statut,
          nb_voeux: async (data) => {
            let count = await Voeu.countDocuments({ "etablissement_accueil.uai": data.uai });
            return count ? count : "0";
          },
        },
      });
    })
  );

  router.get(
    "/api/admin/academies",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async (req, res) => {
      let results = await Log.aggregate([
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
          let found = results.find((r) => r._id === academie.code) || {};
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
