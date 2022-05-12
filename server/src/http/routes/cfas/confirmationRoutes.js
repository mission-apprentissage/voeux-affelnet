const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const authMiddleware = require("../../middlewares/authMiddleware");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const sendActivationEmails = require("../../../jobs/sendActivationEmails");

module.exports = ({ users, emails, cfas }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken, checkIsCfa } = authMiddleware(users);

  router.get(
    "/api/confirmation/status",
    checkActionToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      const cfa = req.user;
      if (cfa.statut !== "en attente") {
        throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le cfa ${cfa.siret}`);
      }

      return res.json({ email: cfa.email, email_source: cfa.email_source });
    })
  );

  router.post(
    "/api/confirmation/accept",
    checkActionToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      const cfa = req.user;
      const { email } = await Joi.object({
        actionToken: Joi.string().required(),
        email: Joi.string().email().optional(),
      }).validateAsync(req.body, { abortEarly: false });

      await cfas.confirm(cfa.siret, email);
      await sendActivationEmails(emails, { username: cfa.username });

      return res.json({});
    })
  );

  return router;
};
