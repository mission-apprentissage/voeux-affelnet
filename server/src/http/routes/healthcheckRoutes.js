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
      const mongodbStatus = mongoose.connection.readyState === 1;

      switch (mongodbStatus) {
        case true:
          logger.info("Healthcheck OK");
          break;
        case false:
          logger.error("Healthcheck KO : MongoDB connection is not ready");
          break;
        default:
          logger.error("Healthcheck KO : MongoDB connection status is unknown");
      }

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
