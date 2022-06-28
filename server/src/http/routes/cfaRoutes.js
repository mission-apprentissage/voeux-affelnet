const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../../common/validators.js");
const { markVoeuxAsDownloaded } = require("../../common/actions/markVoeuxAsDownloaded");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Ufa } = require("../../common/model");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  router.get(
    "/api/cfa/fichiers",
    checkApiToken(),
    ensureIs("Cfa"),
    tryCatch(async (req, res) => {
      const cfa = req.user;

      if (!cfa.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          cfa.etablissements
            .filter((etablissement) => !!etablissement.voeux_date)
            .map(async (etablissement) => {
              const telechargements = cfa.voeux_telechargements
                .filter((t) => t.uai === etablissement.uai && t.date >= etablissement.voeux_date)
                .sort((a, b) => {
                  return a - b;
                });

              const ufa = await Ufa.findOne({ uai: etablissement.uai });

              return {
                //voeux
                name: `${etablissement.uai}.csv`,
                date: etablissement.voeux_date,
                etablissement: ufa,
                lastDownloadDate: telechargements[0]?.date || null,
              };
            })
        )
      );
    })
  );

  router.get(
    "/api/cfa/fichiers/:file",
    checkApiToken(),
    ensureIs("Cfa"),
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
      return compose(getVoeuxStream(uai), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  return router;
};
