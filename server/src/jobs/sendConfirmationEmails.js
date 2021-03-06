const logger = require("../common/logger");
const { Cfa } = require("../common/model");

async function sendConfirmationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const query = {
    unsubscribe: false,
    statut: "en attente",
    emails: { $not: { $elemMatch: { templateName: "confirmation" } } },
    ...(options.username ? { username: options.username } : {}),
  };

  stats.total = await Cfa.countDocuments(query);

  await Cfa.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (cfa) => {
      try {
        logger.info(`Sending confirmation to cfa ${cfa.username}...`);
        await sendEmail(cfa, "confirmation");
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${cfa.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendConfirmationEmails;
