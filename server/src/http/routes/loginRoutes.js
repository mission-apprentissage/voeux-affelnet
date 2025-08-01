const Boom = require("boom");
const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User } = require("../../common/model");
const { sanitize } = require("../utils/sanitizeUtils");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkUsernameAndPassword, checkIsActive, checkActionToken } = authMiddleware();

  router.post(
    "/api/login",
    checkUsernameAndPassword(),
    checkIsActive(),
    tryCatch(async (req, res) => {
      const user = req.user;

      const token = createApiToken(user);
      return res.json({ token });
    })
  );

  router.post(
    "/api/login/test-username",
    tryCatch(async (req, res) => {
      const payload = sanitize(req.body);
      const existingUsername = !!(await User.countDocuments({
        username: payload.username?.replace(/\s/g, "")?.trim(),
      }));
      if (!existingUsername) {
        throw Boom.notFound(`L'identifiant ${payload.username} n'existe pas`);
      }
      return res.json("L'identifiant existe");
    })
  );

  router.get(
    "/api/login/status",
    checkActionToken(),
    tryCatch(async (req, res) => {
      const user = req.user;

      await User.findOneAndUpdate(
        { username: user.username },
        {
          $inc: { "_meta.countNotificationLinkClick": 1 },
        }
      );

      return res.json({ email: user.email, type: user.type, statut: user.statut });
    })
  );

  return router;
};
