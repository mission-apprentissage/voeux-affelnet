const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const validators = require("../utils/validators");
const { getUser } = require("../../common/actions/getUser");
const { changePassword } = require("../../common/actions/changePassword");

module.exports = ({ sender }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkResetPasswordToken } = authMiddleware();
  const UAI_LOWERCASE_PATTERN = /([0-9]{7}[a-z]{1})/;

  router.post(
    "/api/password/forgotten-password",
    tryCatch(async (req, res) => {
      let { username } = await Joi.object({
        username: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      let fixed = UAI_LOWERCASE_PATTERN.test(username) ? username.toUpperCase() : username;
      let user = await getUser(fixed);
      if (!user || !user.password) {
        throw Boom.badRequest(`Utilisateur ${username} invalide`);
      }

      await sender.send(user, "reset_password");
      return res.json({ message: "Un email a été envoyé." });
    })
  );

  router.post(
    "/api/password/reset-password",
    checkResetPasswordToken(),
    tryCatch(async (req, res) => {
      let user = req.user;
      let { newPassword } = await Joi.object({
        resetPasswordToken: Joi.string().required(),
        newPassword: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false });

      await changePassword(user.username, newPassword);

      return res.json({ token: createApiToken(user) });
    })
  );

  return router;
};
