const express = require("express");
const { sortBy } = require("lodash");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { getAcademies } = require("../../common/academies");

module.exports = () => {
  const router = express.Router();

  /**
   * ACADEMIES
   * =============
   */

  router.get(
    "/api/constant/academies",
    tryCatch(async (req, res) => {
      res.json(
        sortBy(getAcademies(), (a) => a.nom).map((academie) => {
          return {
            code: academie.code,
            nom: academie.nom,
          };
        })
      );
    })
  );

  return router;
};
