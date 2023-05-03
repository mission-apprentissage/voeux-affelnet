const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");
const { User } = require("../common/model");
const {
  saveAccountActivationEmailAutomaticSent: saveAccountActivationEmailAutomaticSentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountActivationEmailAutomaticSent: saveAccountActivationEmailAutomaticSentAsFormateur,
} = require("../common/actions/history/formateur");

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

        switch (user.type) {
          case UserType.GESTIONNAIRE:
            await saveAccountActivationEmailAutomaticSentAsResponsable(user);
            break;
          case UserType.FORMATEUR:
            await saveAccountActivationEmailAutomaticSentAsFormateur(user);
            break;
          default:
            break;
        }

        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent ${templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendActivationEmails;
