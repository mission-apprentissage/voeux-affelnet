const logger = require("../common/logger");
const { User, Gestionnaire } = require("../common/model");

async function sendConfirmationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const query = {
    unsubscribe: false,
    statut: "en attente",
    "emails.templateName": { $not: { $regex: "^confirmation_.*$" } },

    $or: [{ type: "Gestionnaire" }, { type: "Formateur" }],

    // TODO : Définir les règles pour trouver les utilisateurs à qui envoyer les mails de confirmations (User de type formateur ou gestionnaire,
    // mais également qui ont des voeux et qui sont destinataires de ces voeux - diffusion autorisée ou gestionnaire sans délégation)

    // $or: [{ type: "Gestionnaire", "etablissements.voeux_date": { $exists: true } }, { type: { $ne: "Gestionnaire" } }],
    ...(options.username ? { username: options.username } : {}),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      if (user.type === "Formateur") {
        const gestionnaire = await Gestionnaire.findOne({ "etablissements.uai": user.username });

        const etablissement = gestionnaire.etablissements?.find((etablissement) => etablissement.uai === user.username);

        if (!etablissement.diffusionAutorisee) {
          return;
        }
        user.email = etablissement?.email;
      }

      const templateName = `confirmation_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

      try {
        logger.info(`Sending ${templateName} to ${user.type} ${user.username}...`);
        await sendEmail(user, templateName);
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendConfirmationEmails;
