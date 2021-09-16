const express = require("express");
const Boom = require("boom");
const { oleoduc } = require("oleoduc");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const authMiddleware = require("../../middlewares/authMiddleware");

module.exports = ({ users, cfas }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, checkIsCfa } = authMiddleware(users);

  function streamVoeux(uai, res) {
    res.setHeader("Content-disposition", `attachment; filename=${uai}.csv`);
    res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
    oleoduc(cfas.voeuxCsvStream(uai), res);
  }

  router.get(
    "/api/fichiers",
    checkApiToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      let cfa = req.user;

      if (!cfa.voeux_date) {
        return res.json([]);
      }

      let lastDownloadDate = cfa.voeux_telechargements.map((e) => e.date).find((date) => date >= cfa.voeux_date);
      res.json([
        {
          //voeux
          name: `${cfa.uai}.csv`,
          date: cfa.voeux_date,
          lastDownloadDate: lastDownloadDate ? lastDownloadDate : null,
        },
      ]);
    })
  );

  router.get(
    "/api/fichiers/:file",
    checkApiToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      let { uai } = req.user;
      let filename = req.params.file;

      if (filename === `${uai}.csv`) {
        await cfas.markVoeuxAsDownloaded(uai);
        return streamVoeux(uai, res);
      } else {
        throw Boom.notFound();
      }
    })
  );

  return router;
};
