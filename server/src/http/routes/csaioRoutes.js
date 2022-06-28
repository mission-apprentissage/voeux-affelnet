const express = require("express");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../../common/validators.js");
const { getVoeuxCroisementStream } = require("../../common/actions/getVoeuxCroisementStream.js");
const { findRegionByCode } = require("../../common/regions.js");
const { getApprenantsStream } = require("../../common/actions/getApprenantsStream.js");
const Boom = require("boom");
const { dateAsString } = require("../../common/utils/stringUtils.js");
const { encodeStream } = require("iconv-lite");
const { getLatestImportDate } = require("../../common/actions/getLatestImportDate.js");

const fichiers = [
  {
    name: "voeux-affelnet-croisement",
    stream: getVoeuxCroisementStream,
  },
  {
    name: "voeux-affelnet-synthese",
    stream: getApprenantsStream,
  },
];

const encoders = {
  csv: (stream, res) => {
    return compose(stream, transformIntoCSV(), res);
  },
  xls: (stream, res) => {
    return compose(
      stream,
      transformIntoCSV({
        separator: "\t",
        mapper: (v) => `="${v || ""}"`,
      }),
      encodeStream("UTF-16"),
      res
    );
  },
};

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  router.get(
    "/api/csaio/fichiers",
    checkApiToken(),
    ensureIs("Csaio"),
    tryCatch(async (req, res) => {
      const latestImportDate = await getLatestImportDate();

      if (!latestImportDate) {
        return res.json([]);
      }

      res.json(
        fichiers.flatMap((f) => {
          return [
            { name: `${f.name}.csv`, date: latestImportDate },
            { name: `${f.name}.xls`, date: latestImportDate },
          ];
        })
      );
    })
  );

  router.get(
    "/api/csaio/fichiers/:filename.:ext",
    checkApiToken(),
    ensureIs("Csaio"),
    tryCatch(async (req, res) => {
      const { filename, ext } = await validate(req.params, {
        filename: Joi.string().valid("voeux-affelnet-croisement", "voeux-affelnet-synthese").required(),
        ext: Joi.string().valid("csv", "xls").required(),
      });

      const fichier = fichiers.find((f) => f.name === filename);
      const latestImportDate = await getLatestImportDate();
      const academies = findRegionByCode(req.user.region.code).academies.map((a) => a.code);
      if (!fichier) {
        throw Boom.badRequest("Nom de fichier invalide");
      }

      res.setHeader("Content-Type", "text/csv; charset=UTF-8");
      res.setHeader(
        "Content-disposition",
        `attachment; filename=${fichier.name}-${dateAsString(latestImportDate)}.csv`
      );

      const stream = await fichier.stream({ academies });
      return encoders[ext](stream, res);
    })
  );

  return router;
};
