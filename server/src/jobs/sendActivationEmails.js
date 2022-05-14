const logger = require("../common/logger");
const { User } = require("../common/model");

async function sendActivationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const query = {
    unsubscribe: false,
    password: { $exists: false },
    statut: "confirmé",
    "emails.templateName": { $nin: ["activation", "activation_cfa"] },
    $or: [{ type: "Cfa", "etablissements.voeux_date": { $exists: true } }, { type: { $exists: false } }],
    ...(options.username ? { username: options.username } : {}),
  };

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      try {
        const templateName = user.type === "Cfa" ? "activation_cfa" : "activation";
        logger.info(`Sending ${templateName} to user ${user.username}...`);
        await sendEmail(user, templateName);
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendActivationEmails;
