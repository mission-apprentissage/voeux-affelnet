const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { confirm } = require("../../common/actions/confirm");
const authMiddleware = require("../middlewares/authMiddleware");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const sendActivationEmails = require("../../jobs/sendActivationEmails");

module.exports = ({ sendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkActionToken, checkIsCfa } = authMiddleware();

  router.get(
    "/api/confirmation/status",
    checkActionToken(),
    checkIsCfa(),
    tryCatch(async (req, res) => {
      const cfa = req.user;
      if (cfa.statut !== "en attente") {
        //TODO incrémenter un compteur qui permet de savoir combien de fois il y eu ce problème
        // Dans le modèle en général ce genre d'information va dans _meta
        throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le cfa ${cfa.siret}`);
      }

      return res.json({ email: cfa.email });
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

      await confirm(cfa.siret, email);
      //TODO envoyer un email de validation de confirmation
      await sendActivationEmails(sendEmail, { username: cfa.username });

      return res.json({});
    })
  );

  return router;
};
