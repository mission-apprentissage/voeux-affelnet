const express = require("express");
const Joi = require("@hapi/joi");
const { compose } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../../common/validators.js");
const { getVoeuxCroisementCsvStream } = require("../../common/actions/getVoeuxCroisementCsvStream.js");
const { findRegionByCode } = require("../../common/regions.js");
const { Voeu } = require("../../common/model/index.js");
const { DateTime } = require("luxon");

const fichiers = [
  {
    name: "croisement",
    stream: getVoeuxCroisementCsvStream,
  },
  {
    name: "aggregation",
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
    "/api/csaio/fichiers/:file.:ext",
    checkApiToken(),
    ensureIs("Csaio"),
    tryCatch(async (req, res) => {
      const academies = findRegionByCode(req.user.region.code).academies.map((a) => a.code);
      const { file, ext } = await validate(req.params, {
        file: Joi.string().valid("croisement", "aggregation").required(),
        ext: Joi.string().valid("csv").required(),
      });

      const latestImportDate = await getLatestImportDate();

      const { stream } = fichiers.find((f) => f.name === file);
      const filename = `${file}-${DateTime.fromJSDate(latestImportDate).setLocale("fr").toFormat("yyyy-MM-dd")}.${ext}`;

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/${ext}; charset=UTF-8`);
      return compose(await stream({ academies }), res);
    })
  );

  return router;
};
