const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { confirm } = require("../../common/actions/confirm");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const sendActivationEmails = require("../../jobs/sendActivationEmails");
const { User } = require("../../common/model");

module.exports = ({ sendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken, ensureIs } = authMiddleware();

  router.get(
    "/api/confirmation/status",
    checkActionToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const cfa = req.user;

      await User.findOneAndUpdate(
        { username: cfa.username },
        {
          $inc: { "_meta.countConfirmationLinkClick": 1 },
        }
      );

      if (cfa.statut !== "en attente") {
        throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le cfa ${cfa.siret}`);
      }

      return res.json({ email: cfa.email });
    })
  );

  router.post(
    "/api/confirmation/accept",
    checkActionToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const cfa = req.user;
      const { email } = await Joi.object({
        actionToken: Joi.string().required(),
        email: Joi.string().email().optional(),
      }).validateAsync(req.body, { abortEarly: false });

      await confirm(cfa.siret, email);

      await sendEmail({ ...cfa, email }, "confirmed");

      await sendActivationEmails(sendEmail, { username: cfa.username });

      return res.json({});
    })
  );

  return router;
};
