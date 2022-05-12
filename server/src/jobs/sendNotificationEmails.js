const logger = require("../common/logger");
const { Cfa } = require("../common/model");
const { every } = require("lodash");

function allFilesAsAlreadyBeenDownloaded(cfa) {
  return !!cfa.voeux_telechargements.find((download) => {
    return every(
      cfa.etablissements.map((e) => e.voeux_date),
      (date) => download.date > date
    );
  });
}

async function sendNotificationEmails(sender, options = {}) {
  let stats = { total: 0, sent: 0, failed: 0 };
  let templateName = "notification";
  let limit = options.limit || Number.MAX_SAFE_INTEGER;
  let query = {
    unsubscribe: false,
    statut: "activé",
    "etablissements.voeux_date": { $exists: true },
    "emails.templateName": { $ne: templateName },
  };

  await Cfa.find(query)
    .lean()
    .cursor()
    .eachAsync(async (cfa) => {
      if (allFilesAsAlreadyBeenDownloaded(cfa)) {
        return;
      }

      try {
        stats.total++;
        if (limit > stats.sent) {
          logger.info(`Sending ${templateName} to user ${cfa.username}...`);
          await sender.send(cfa, templateName);
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
