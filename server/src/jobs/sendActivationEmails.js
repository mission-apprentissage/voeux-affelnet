const { UserStatut } = require("../common/constants/UserStatut");
const logger = require("../common/logger");
const { User } = require("../common/model");

async function sendActivationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const query = {
    unsubscribe: false,
    password: { $exists: false },
    statut: UserStatut.CONFIRME,
    "emails.templateName": { $not: { $regex: "^activation_.*$" } },
    $or: [
      { type: "Gestionnaire" /*, "etablissements.voeux_date": { $exists: true } */ },
      { type: "Formateur" /*, "etablissements.voeux_date": { $exists: true } */ },
      { type: { $nin: ["Gestionnaire", "Formateur"] } },
    ],
    ...(options.username ? { username: options.username } : {}),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      const templateName = `activation_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

      try {
        logger.info(`Sending ${templateName} email to ${user.type} ${user.username}...`);
        await sendEmail(user, templateName);
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent ${templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendActivationEmails;
