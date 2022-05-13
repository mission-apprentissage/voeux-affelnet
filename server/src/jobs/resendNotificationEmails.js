const logger = require("../common/logger");
const { DateTime } = require("luxon");
const { Cfa } = require("../common/model");
const config = require("../config");
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
  let stats = { total: 0, sent: 0, failed: 0 };
  let limit = options.limit || Number.MAX_SAFE_INTEGER;
  let query = {
    unsubscribe: false,
    statut: "activé",
    "etablissements.voeux_date": { $exists: true },
    ...(options.retry
      ? {
          emails: {
            $elemMatch: {
              templateName: "notification",
              "error.type": "fatal",
            },
          },
        }
      : {
          emails: {
            $elemMatch: {
              templateName: "notification",
              error: { $exists: false },
              $and: [
                {
                  sendDates: {
                    $not: { $gt: DateTime.now().minus({ days: config.emails.relances.notification }).toJSDate() },
                  },
                },
                { "sendDates.2": { $exists: false } },
              ],
            },
          },
        }),
  };

  await Cfa.find(query)
    .lean()
    .cursor()
    .eachAsync(async (cfa) => {
      if (allFilesAsAlreadyBeenDownloaded(cfa)) {
        return;
      }

      let previous = cfa.emails.find((e) => e.templateName === "notification");

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
