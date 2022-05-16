const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../utils/validators");
const { markVoeuxAsDownloaded } = require("../../common/actions/markVoeuxAsDownloaded");
const { voeuxCsvStream } = require("../../common/voeuxCsvStream");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, checkIsCfa } = authMiddleware(users);

  router.get(
    "/api/fichiers",
    checkApiToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      const cfa = req.user;

      if (!cfa.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        cfa.etablissements.map((etablissement) => {
          const telechargements = cfa.voeux_telechargements
            .filter((t) => t.uai === etablissement.uai && t.date >= etablissement.voeux_date)
            .sort((a, b) => {
              return a - b;
            });

          return {
            //voeux
            name: `${etablissement.uai}.csv`,
            date: etablissement.voeux_date,
            lastDownloadDate: telechargements[0]?.date || null,
          };
        })
      );
    })
  );

  router.get(
    "/api/fichiers/:file",
    checkApiToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { file } = await validate(req.params, {
        file: Joi.string()
          .pattern(/^[0-9]{7}[A-Z]{1}\.csv$/)
          .required(),
      });

      const uai = file.split(".csv")[0];

      if (!req.user.etablissements.find((e) => e.uai === uai)) {
        throw Boom.notFound();
      }

      await markVoeuxAsDownloaded(siret, uai);
      res.setHeader("Content-disposition", `attachment; filename=${uai}.csv`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(voeuxCsvStream(uai), res);
    })
  );

  return router;
};
