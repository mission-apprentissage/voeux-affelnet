const logger = require("../common/logger");
const { Cfa } = require("../common/model");

function isAlreadyDownloaded(cfa) {
  return !!cfa.voeux_telechargements.find((download) => {
    return download.date > cfa.voeux_date;
  });
}

async function sendNotificationEmails(emails, options = {}) {
  let stats = { total: 0, sent: 0, failed: 0 };
  let templateName = "notification";
  let limit = options.limit || Number.MAX_SAFE_INTEGER;
  let query = {
    unsubscribe: false,
    statut: "activé",
    voeux_date: { $exists: true },
    "emails.templateName": { $ne: templateName },
  };

  await Cfa.find(query)
    .lean()
    .cursor()
    .eachAsync(async (cfa) => {
      if (isAlreadyDownloaded(cfa)) {
        return;
      }

      try {
        stats.total++;
        if (limit > stats.sent) {
          logger.info(`Sending ${templateName} to user ${cfa.username}...`);
          await emails.send(cfa, templateName);
          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to sent email to ${cfa.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendNotificationEmails;
