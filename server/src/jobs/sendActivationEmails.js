const logger = require("../common/logger");
const { User } = require("../common/model");

async function sendActivationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const query = {
    unsubscribe: false,
    password: { $exists: false },
    statut: "confirmé",
    "emails.templateName": { $not: { $regex: "^activation_.*$" } },
    $or: [{ type: "Cfa", "etablissements.voeux_date": { $exists: true } }, { type: { $ne: "Cfa" } }],
    ...(options.username ? { username: options.username } : {}),
  };

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      try {
        const templateName = `activation_${(user.type || "user").toLowerCase()}`;
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
