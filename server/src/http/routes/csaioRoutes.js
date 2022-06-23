const express = require("express");
const Joi = require("@hapi/joi");
const { compose } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../../common/validators.js");
const { getVoeuxCroisementCsvStream } = require("../../common/actions/getVoeuxCroisementCsvStream.js");
const { findRegionByCode } = require("../../common/regions.js");
const { Voeu } = require("../../common/model/index.js");
const { getApprenantsCsvStream } = require("../../common/actions/getApprenantsCsvStream.js");
const Boom = require("boom");
const { dateAsString } = require("../../common/utils/objectUtils.js");

const fichiers = [
  {
    name: "voeux-affelnet-croisement",
    stream: getVoeuxCroisementCsvStream,
  },
  {
    name: "voeux-affelnet-synthese",
    stream: getApprenantsCsvStream,
  },
];

function getLatestImportDate() {
  return Voeu.aggregate([
    { $unwind: "$_meta.import_dates" },
    { $group: { _id: "$_meta.import_dates" } },
    { $sort: { _id: -1 } },
  ]).then((agg) => agg[0]?._id);
}

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  router.get(
    "/api/csaio/fichiers",
    checkApiToken(),
    ensureIs("Csaio"),
    tryCatch(async (req, res) => {
      const latestImportDate = await getLatestImportDate();

      res.json(
        !latestImportDate
          ? []
          : fichiers.map((f) => {
              return {
                name: `${f.name}.csv`,
                date: latestImportDate,
              };
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
        ext: Joi.string().valid("csv").required(),
      });

      const academies = findRegionByCode(req.user.region.code).academies.map((a) => a.code);
      const latestImportDate = await getLatestImportDate();
      const fichier = fichiers.find((f) => f.name === filename);

      if (!fichier) {
        throw Boom.badRequest("Nom de fichier invalide");
      }

      res.setHeader(
        "Content-disposition",
        `attachment; filename=${fichier.name}-${dateAsString(latestImportDate)}.csv`
      );
      res.setHeader("Content-Type", `text/${ext}; charset=UTF-8`);
      return compose(await fichier.stream({ academies }), res);
    })
  );

  return router;
};
