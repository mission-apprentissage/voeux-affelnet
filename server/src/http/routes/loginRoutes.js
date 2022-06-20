const Boom = require("boom");
const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User } = require("../../common/model");
const { sanitize } = require("../utils/sanitizeUtils");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkUsernameAndPassword } = authMiddleware();

  router.post(
    "/api/login",
    checkUsernameAndPassword(),
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
      const existingUsername = !!(await User.countDocuments({ username: payload.username }));
      if (!existingUsername) {
        throw Boom.badRequest("L'identifiant n'existe pas");
      }
      return res.json("L'identifiant existe");
    })
  );

  return router;
};
