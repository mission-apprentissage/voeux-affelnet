const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { confirm } = require("../../common/actions/confirm");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const sendActivationEmails = require("../../jobs/sendActivationEmails");
const resendActivationEmails = require("../../jobs/resendActivationEmails");
const { User, Responsable } = require("../../common/model");

module.exports = ({ sendEmail, resendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken, ensureIsOneOf } = authMiddleware();

  router.get(
    "/api/confirmation/status",
    checkActionToken(),
    ensureIsOneOf(["Responsable", "Formateur"]),
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
        const responsable = await Responsable.findOne({ "etablissements.uai": user.username });

        const etablissement = responsable.etablissements_formateur?.find(
          (etablissement) => etablissement.uai === user.username
        );

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
    ensureIsOneOf(["Responsable", "Formateur"]),
    tryCatch(async (req, res) => {
      const user = req.user;
      const { email } = await Joi.object({
        actionToken: Joi.string().required(),
        email: Joi.string().email().optional(),
      }).validateAsync(req.body, { abortEarly: false });

      await confirm(user.username, email);

      await sendEmail({ ...user, email }, "confirmed");

      const previousActivationEmail = user.emails?.find((e) => e.templateName.startsWith("activation_"));

      previousActivationEmail
        ? await resendActivationEmails(resendEmail, { username: user.username, force: true })
        : await sendActivationEmails(sendEmail, { username: user.username });

      return res.json({});
    })
  );

  return router;
};
