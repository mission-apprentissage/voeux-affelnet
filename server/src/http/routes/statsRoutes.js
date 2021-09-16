const express = require("express");
const { sortBy } = require("lodash");
const Joi = require("@hapi/joi");
const { getAcademies } = require("../../common/academies");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { JobEvent } = require("../../common/model");
const { sendJsonStream } = require("../utils/httpUtils");
const { stringList } = require("../utils/validators");
const computeStats = require("../../jobs/computeStats");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.get(
    "/api/stats/:jobName",
    tryCatch(async (req, res) => {
      let { jobName } = await Joi.object({
        jobName: Joi.string().valid("computeStats", "importCfas", "importVoeux").required(),
      }).validateAsync(req.params, { abortEarly: false });

      let stream = oleoduc(
        JobEvent.find({ job: jobName }, { _id: 0, type: 0 }).sort({ date: -1 }).lean().cursor(),
        transformIntoJSON({
          arrayPropertyName: "results",
        })
      );

      return sendJsonStream(stream, res);
    })
  );

  router.get(
    "/api/stats/:jobName/now",
    tryCatch(async (req, res) => {
      let { academies } = await Joi.object({
        jobName: Joi.string().valid("computeStats").required(),
        academies: stringList(),
      }).validateAsync({ ...req.params, ...req.query }, { abortEarly: false });

      let stats = await computeStats(academies ? { academies } : {});

      return res.json({
        stats,
        _meta: {
          academies: [
            { code: "ALL", nom: "Toutes" },
            ...sortBy(
              getAcademies().map((a) => ({ code: a.code, nom: a.nom })),
              (a) => a.nom
            ),
            { code: "UNKNOWN", nom: "Inconnues" },
            { code: "AFFELNET", nom: "Avec import AFFELNET" },
            { code: "SANS_AFFELNET", nom: "Sans import AFFELNET" },
          ],
        },
      });
    })
  );

  return router;
};
