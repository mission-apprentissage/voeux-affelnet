const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { confirm } = require("../../common/actions/confirm");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const sendActivationEmails = require("../../jobs/sendActivationEmails");
const { User, Gestionnaire } = require("../../common/model");

module.exports = ({ sendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken, ensureIsOneOf } = authMiddleware();

  router.get(
    "/api/confirmation/status",
    checkActionToken(),
    ensureIsOneOf(["Gestionnaire", "Formateur"]),
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

      if (user.type === "Formateur") {
        const gestionnaire = await Gestionnaire.findOne({ "etablissements.uai": user.username });

        const etablissement = gestionnaire.etablissements?.find((etablissement) => etablissement.uai === user.username);

        if (!etablissement.diffusionAutorisee) {
          throw Boom.badRequest(`Aucune délégation de droit n'a été activée pour votre compte ${user.username}`);
        }
        user.email = etablissement?.email;
      }

      return res.json({ email: user.email, type: user.type });
    })
  );

  router.post(
    "/api/confirmation/accept",
    checkActionToken(),
    ensureIsOneOf(["Gestionnaire", "Formateur"]),
    tryCatch(async (req, res) => {
      const user = req.user;
      const { email } = await Joi.object({
        actionToken: Joi.string().required(),
        email: Joi.string().email().optional(),
      }).validateAsync(req.body, { abortEarly: false });

      await confirm(user.username, email);

      await sendEmail({ ...user, email }, "confirmed");

      await sendActivationEmails(sendEmail, { username: user.username });

      return res.json({});
    })
  );

  return router;
};
