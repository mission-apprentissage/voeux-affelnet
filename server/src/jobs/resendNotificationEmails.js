const logger = require("../common/logger");
const { DateTime } = require("luxon");
const { Gestionnaire } = require("../common/model");
const { every } = require("lodash");

function allFilesAsAlreadyBeenDownloaded(cfa) {
  return !!cfa.voeux_telechargements.find((download) => {
    return every(
      cfa.etablissements.map((e) => e.voeux_date),
      (date) => download.date > date
    );
  });
}

async function resendNotificationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const query = {
    unsubscribe: false,
    statut: "activé",
    "etablissements.voeux_date": { $exists: true },
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : options.retry
      ? {
          emails: {
            $elemMatch: {
              templateName: /^notification.*/,
              "error.type": "fatal",
            },
          },
        }
      : {
          emails: {
            $elemMatch: {
              templateName: /^notification.*/,
              error: { $exists: false },
              $and: [
                { sendDates: { $not: { $gt: DateTime.now().minus({ days: 7 }).toJSDate() } } },
                { "sendDates.2": { $exists: false } },
              ],
            },
          },
        }),
  };

  await Gestionnaire.find(query)
    .lean()
    .cursor()
    .eachAsync(async (cfa) => {
      if (allFilesAsAlreadyBeenDownloaded(cfa) && !options.force) {
        return;
      }

      const previous = cfa.emails.find((e) => e.templateName.startsWith("notification_"));

      try {
        stats.total++;
        if (limit > stats.sent) {
          logger.info(`Resending notification to cfa ${cfa.username}...`);
          await resendEmail(previous.token);
          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to sent email to ${cfa.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendNotificationEmails;
