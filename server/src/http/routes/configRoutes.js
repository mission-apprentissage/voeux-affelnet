const express = require("express");
const { Config } = require("../../common/model");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { sanitize } = require("../utils/sanitizeUtils");

module.exports = () => {
  const router = express.Router();
  const { checkApiToken, checkIsAdmin } = authMiddleware();

  router.get("/api/config", async (req, res) => {
    if (!(await Config.countDocuments())) {
      await new Config({}).save();
    }

    const config = await Config.findOne({}, { _id: 0, __v: 0 }).lean();

    return res.json(config);
  });

  router.put(
    "/api/admin/config",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async ({ body }, res) => {
      const payload = sanitize(body);

      const result = await Config.findOneAndUpdate({}, payload, {
        new: true,
      });

      return res.json(result);
    })
  );

  router.patch(
    "/api/admin/config",
    checkApiToken(),
    checkIsAdmin(),
    tryCatch(async ({ body }, res) => {
      const payload = sanitize(body);
      const result = await Config.findOneAndUpdate({}, payload, {
        new: false,
      });

      return res.json(result);
    })
  );

  return router;
};
