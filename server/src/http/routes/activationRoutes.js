const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const validators = require("../../common/validators.js");
const { activateUser } = require("../../common/actions/activateUser");
const { UserStatut } = require("../../common/constants/UserStatut.js");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken } = authMiddleware();

  router.get(
    "/api/activation/status",
    checkActionToken(),
    tryCatch(async (req, res) => {
      const user = req.user;
      if (user.statut !== UserStatut.CONFIRME) {
        throw Boom.badRequest(`L'utilisateur ${user.username} est déjà activé`);
      }

      return res.json({});
    })
  );

  router.post(
    "/api/activation",
    checkActionToken(),
    tryCatch(async (req, res) => {
      const user = req.user;
      const { password } = await Joi.object({
        actionToken: Joi.string().required(),
        password: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false });

      if (user.password) {
        throw Boom.badRequest(`L'utilisateur ${user.username} a déjà été créé.`);
      }

      await activateUser(user.username, password);

      return res.json({ token: createApiToken(user) });
    })
  );

  return router;
};
