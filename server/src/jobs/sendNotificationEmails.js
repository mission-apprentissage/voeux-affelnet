const logger = require("../common/logger");
const { User } = require("../common/model");
const { every } = require("lodash");

function allFilesAsAlreadyBeenDownloaded(gestionnaire) {
  return !!gestionnaire.voeux_telechargements.find((download) => {
    return every(
      gestionnaire.etablissements.map((e) => e.voeux_date),
      (date) => download.date > date
    );
  });
}

async function sendNotificationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  // const templateName = "notification";
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const query = {
    unsubscribe: false,
    statut: "activé",
    "etablissements.voeux_date": { $exists: true },
    "emails.templateName": { $not: { $regex: "^notification_.*$" } },

    ...(options.username ? { username: options.username } : {}),
  };

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      if (allFilesAsAlreadyBeenDownloaded(user)) {
        return;
      }

      const templateName = `notification_${(user.type?.toLowerCase() || "user").toLowerCase()}`;

      stats.total++;

      try {
        if (limit > stats.sent) {
          logger.info(`Sending ${templateName} to ${user.type} ${user.username}...`);
          await sendEmail(user, templateName);
          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to sent email to ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendNotificationEmails;
