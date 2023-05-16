const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
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
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: UserStatut.ACTIVE,

          "etablissements.voeux_date": { $exists: true },
          "emails.templateName": { $not: { $regex: "^notification_.*$" } },

          $or: [{ type: UserType.GESTIONNAIRE }, { type: UserType.FORMATEUR }],
        }),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      if (allFilesAsAlreadyBeenDownloaded(user)) {
        return;
      }

      const templateName = `notification_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

      try {
        if (limit > stats.sent) {
          logger.info(`Sending ${templateName} email to ${user.type} ${user.username}...`);
          await sendEmail(user, templateName);
          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to sent ${templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendNotificationEmails;
