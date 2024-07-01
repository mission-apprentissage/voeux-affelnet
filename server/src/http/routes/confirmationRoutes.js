const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { confirm } = require("../../common/actions/confirm");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { User } = require("../../common/model");

module.exports = ({ sendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken, ensureIsOneOf } = authMiddleware();

  router.get(
    "/api/confirmation/status",
    checkActionToken(),
    ensureIsOneOf(["Responsable"]),
    tryCatch(async (req, res) => {
      const user = req.user;

      await User.findOneAndUpdate(
        { username: user.username },
        {
          $inc: { "_meta.countConfirmationLinkClick": 1 },
        }
      );

      if (user.statut !== "en attente") {
        throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le compte ${user.username}`);
      }

      return res.json({ email: user.email, type: user.type });
    })
  );

  router.post(
    "/api/confirmation/accept",
    checkActionToken(),
    ensureIsOneOf(["Responsable"]),
    tryCatch(async (req, res) => {
      const user = req.user;
      const { email } = await Joi.object({
        actionToken: Joi.string().required(),
        email: Joi.string().email().optional(),
      }).validateAsync(req.body, { abortEarly: false });

      await confirm(user.username, email);

      await sendEmail({ ...user, email }, "confirmed");

      return res.json({});
    })
  );

  return router;
};
