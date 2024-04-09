const logger = require("../common/logger");
const { DateTime } = require("luxon");
const { User, Responsable } = require("../common/model");
const { UserStatut } = require("../common/constants/UserStatut");
const { allFilesAsAlreadyBeenDownloaded, filesHaveUpdate } = require("../common/utils/dataUtils");
const { UserType } = require("../common/constants/UserType");

const {
  saveListAvailableEmailManualResent: saveListAvailableEmailManualResentAsResponsable,
  saveListAvailableEmailAutomaticResent: saveListAvailableEmailAutomaticResentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveListAvailableEmailManualResent: saveListAvailableEmailManualResentAsFormateur,
  saveListAvailableEmailAutomaticResent: saveListAvailableEmailAutomaticResentAsFormateur,
} = require("../common/actions/history/formateur");

async function resendNotificationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: { $nin: [UserStatut.NON_CONCERNE] },

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
                      { sendDates: { $not: { $gt: DateTime.now().minus({ days: 1 }).toJSDate() } } },
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
      if (user.type === UserType.FORMATEUR) {
        const responsable = await Responsable.findOne({
          "etablissements.uai": user.username,
          "etablissements.diffusionAutorisee": true,
        });

        if (!responsable) {
          return;
        }

        const etablissement = responsable.etablissements_formateur?.find(
          (etablissement) => etablissement.diffusionAutorisee && etablissement.uai === user.username
        );

        user.email = user.email || etablissement?.email;
      }

      if (await allFilesAsAlreadyBeenDownloaded(user)) {
        return;
      }

      if (await filesHaveUpdate(user)) {
        return;
      }

      const previous = user.emails.find((e) => e.templateName.startsWith("notification_"));

      try {
        stats.total++;
        if (limit > stats.sent) {
          logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
          await resendEmail(previous.token);

          switch (user.type) {
            case UserType.RESPONSABLE:
              options.sender
                ? await saveListAvailableEmailManualResentAsResponsable(user, options.sender)
                : await saveListAvailableEmailAutomaticResentAsResponsable(user);
              break;
            case UserType.FORMATEUR:
              options.sender
                ? await saveListAvailableEmailManualResentAsFormateur(user, options.sender)
                : await saveListAvailableEmailAutomaticResentAsFormateur(user);
              break;
            default:
              break;
          }

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
