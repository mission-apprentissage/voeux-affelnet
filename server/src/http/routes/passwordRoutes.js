const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const validators = require("../utils/validators");
const { getUser } = require("../../common/actions/getUser");
const { changePassword } = require("../../common/actions/changePassword");

module.exports = ({ sendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkResetPasswordToken } = authMiddleware();
  const UAI_LOWERCASE_PATTERN = /([0-9]{7}[a-z]{1})/;

  router.post(
    "/api/password/forgotten-password",
    tryCatch(async (req, res) => {
      const { username } = await Joi.object({
        username: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      const fixed = UAI_LOWERCASE_PATTERN.test(username) ? username.toUpperCase() : username;
      const user = await getUser(fixed);
      if (!user || !user.password) {
        throw Boom.badRequest(`Utilisateur ${username} invalide`);
      }

      await sendEmail(user, "reset_password");
      return res.json({ message: "Un email a été envoyé." });
    })
  );

  router.post(
    "/api/password/reset-password",
    checkResetPasswordToken(),
    tryCatch(async (req, res) => {
      const user = req.user;
      const { newPassword } = await Joi.object({
        resetPasswordToken: Joi.string().required(),
        newPassword: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false });

      await changePassword(user.username, newPassword);

      return res.json({ token: createApiToken(user) });
    })
  );

  return router;
};
