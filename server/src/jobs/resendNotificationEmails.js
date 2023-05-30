const logger = require("../common/logger");
const { DateTime } = require("luxon");
const { User } = require("../common/model");
const { every } = require("lodash");
const { UserStatut } = require("../common/constants/UserStatut");

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
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: UserStatut.ACTIVE,
          "etablissements.voeux_date": { $exists: true },
          ...(options.retry
            ? {
                emails: {
                  $elemMatch: {
                    templateName: /^notification_.*/,
                    "error.type": { $in: ["fatal", "soft_bounce"] },
                  },
                },
              }
            : {
                emails: {
                  $elemMatch: {
                    templateName: /^notification_.*/,
                    error: { $exists: false },
                    $and: [
                      { sendDates: { $not: { $gt: DateTime.now().minus({ days: 7 }).toJSDate() } } },
                      { "sendDates.2": { $exists: false } },
                    ],
                  },
                },
              }),
        }),
  };

  await User.find(query)
    .lean()
    .cursor()
    .eachAsync(async (user) => {
      if (allFilesAsAlreadyBeenDownloaded(user) && !options.force) {
        return;
      }

      const previous = user.emails.find((e) => e.templateName.startsWith("notification_"));

      try {
        stats.total++;
        if (limit > stats.sent) {
          logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
          await resendEmail(previous.token);
          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to resent ${previous.templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendNotificationEmails;
