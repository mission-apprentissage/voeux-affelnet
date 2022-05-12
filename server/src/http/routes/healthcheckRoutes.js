const Boom = require("boom");
const express = require("express");
const mongoose = require("mongoose");
const logger = require("../../common/logger");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/api/healthcheck",
    tryCatch(async (req, res) => {
      let mongodbStatus;
      await mongoose.connection.db
        .collection("voeux")
        .stats()
        .then(() => {
          mongodbStatus = true;
        })
        .catch((e) => {
          mongodbStatus = false;
          logger.error("Healthcheck failed", e);
        });

      return res.json({
        healthcheck: mongodbStatus,
      });
    })
  );

  router.get(
    "/api/healthcheck/error",
    tryCatch(() => {
      throw Boom.internal();
    })
  );

  return router;
};
