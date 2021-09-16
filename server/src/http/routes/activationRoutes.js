const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const validators = require("../utils/validators");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken } = authMiddleware(users);

  router.get(
    "/api/activation/status",
    checkActionToken(),
    tryCatch(async (req, res) => {
      let user = req.user;
      if (user.statut !== "confirmé") {
        throw Boom.badRequest(`L'utilisateur ${user.username} est déjà activé`);
      }

      return res.json({});
    })
  );

  router.post(
    "/api/activation",
    checkActionToken(),
    tryCatch(async (req, res) => {
      let user = req.user;
      let { password } = await Joi.object({
        actionToken: Joi.string().required(),
        password: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false });

      if (user.password) {
        throw Boom.badRequest(`L'utilisateur ${user.username} a déjà été créé.`);
      }

      await users.activate(user.username, password);

      return res.json({ token: createApiToken(user) });
    })
  );

  return router;
};
