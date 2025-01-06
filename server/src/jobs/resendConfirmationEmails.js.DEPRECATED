const { DateTime } = require("luxon");
const logger = require("../common/logger");
const { User } = require("../common/model");
const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");

const {
  saveAccountConfirmationEmailManualResent: saveAccountConfirmationEmailManualResentAsResponsable,
  saveAccountConfirmationEmailAutomaticResent: saveAccountConfirmationEmailAutomaticResentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountConfirmationEmailManualResent: saveAccountConfirmationEmailManualResentAsDelegue,
  saveAccountConfirmationEmailAutomaticResent: saveAccountConfirmationEmailAutomaticResentAsDelegue,
} = require("../common/actions/history/delegue");

async function resendConfirmationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const maxNbEmailsSent = options.max || 2;
  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: UserStatut.EN_ATTENTE,
          ...(options.retry
            ? {
                emails: {
                  $elemMatch: {
                    templateName: /^confirmation_.*/,
                    "error.type": { $in: ["fatal", "soft_bounce"] },
                  },
                },
              }
            : {
                emails: {
                  $elemMatch: {
                    templateName: /^confirmation_.*/,
                    ...(options.username
                      ? {}
                      : {
                          error: { $exists: false },
                          $and: [
                            { sendDates: { $not: { $gt: DateTime.now().minus({ days: 3 }).toJSDate() } } },
                            { [`sendDates.${maxNbEmailsSent}`]: { $exists: false } },
                          ],
                        }),
                  },
                },
              }),

          $or: [{ type: UserType.RESPONSABLE }],
        }),
  };

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      const previous = user.emails.find((e) => e.templateName.startsWith("confirmation_"));

      try {
        logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
        await resendEmail(previous.token, { retry: options.retry, user });

        switch (user.type) {
          case UserType.RESPONSABLE:
            options.sender
              ? await saveAccountConfirmationEmailManualResentAsResponsable(user, options.sender)
              : await saveAccountConfirmationEmailAutomaticResentAsResponsable(user);
            break;
          case UserType.DELEGUE:
            options.sender
              ? await saveAccountConfirmationEmailManualResentAsDelegue(user, options.sender)
              : await saveAccountConfirmationEmailAutomaticResentAsDelegue(user);
            break;
          default:
            break;
        }

        stats.sent++;
      } catch (e) {
        logger.error(`Unable to resent ${previous.templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendConfirmationEmails;
