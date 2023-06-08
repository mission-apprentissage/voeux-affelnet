const express = require("express");
const { Alert } = require("../../common/model");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { sanitize } = require("../utils/sanitizeUtils");

module.exports = () => {
  const router = express.Router();
  const { checkApiToken, checkIsAdmin } = authMiddleware();

  router.get("/api/alert", async (req, res) => {
    const result = await Alert.find({});
    return res.json(result);
  });

  router.post(
    "/api/admin/alert",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async ({ body }, res) => {
      const payload = sanitize(body);
      const { msg, enabled } = payload;

      if (!msg || enabled === undefined) {
        return res.status(400).send({ error: "Erreur avec le message ou enabled" });
      }

      const newAlert = new Alert({
        msg,
        enabled,
        time: new Date(),
      });

      newAlert.save();

      return res.json(newAlert);
    })
  );

  router.put(
    "/api/admin/alert/:id",
    tryCatch(async ({ body, params }, res) => {
      const payload = sanitize(body);
      const { msg } = payload;

      if (!msg) {
        return res.status(400).send({ error: "Erreur avec le message" });
      }

      const result = await Alert.findOneAndUpdate({ _id: params.id }, payload, {
        new: true,
      });

      return res.json(result);
    })
  );

  router.patch(
    "/api/admin/alert/:id",
    tryCatch(async ({ body, params }, res) => {
      const payload = sanitize(body);
      const result = await Alert.findOneAndUpdate({ _id: params.id }, payload, {
        new: false,
      });

      return res.json(result);
    })
  );

  router.delete(
    "/api/admin/alert/:id",
    tryCatch(async (req, res) => {
      const result = await Alert.deleteOne({ _id: req.params.id });
      return res.json(result);
    })
  );

  return router;
};
