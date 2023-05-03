const { DateTime } = require("luxon");
const logger = require("../common/logger");
const { User } = require("../common/model");
const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");

const {
  saveAccountActivationEmailManualResent: saveAccountActivationEmailManualResentAsResponsable,
  saveAccountActivationEmailAutomaticResent: saveAccountActivationEmailAutomaticResentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountActivationEmailManualResent: saveAccountActivationEmailManualResentAsFormateur,
  saveAccountActivationEmailAutomaticResent: saveAccountActivationEmailAutomaticResentAsFormateur,
} = require("../common/actions/history/formateur");

async function resendActivationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const maxNbEmailsSent = options.max || 2;
  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          password: { $exists: false },
          statut: UserStatut.CONFIRME,
          ...(options.retry
            ? {
                emails: {
                  $elemMatch: {
                    templateName: /^activation_.*/,
                    "error.type": "fatal",
                  },
                },
              }
            : {
                emails: {
                  $elemMatch: {
                    templateName: /^activation_.*/,
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
        }),
  };

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      const previous = user.emails.find((e) => e.templateName.startsWith("activation_"));

      try {
        logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
        await resendEmail(previous.token);

        switch (user.type) {
          case UserType.GESTIONNAIRE:
            options.username
              ? await saveAccountActivationEmailManualResentAsResponsable(user, options.admin)
              : await saveAccountActivationEmailAutomaticResentAsResponsable(user);
            break;
          case UserType.FORMATEUR:
            options.username
              ? await saveAccountActivationEmailManualResentAsFormateur(user, options.admin)
              : await saveAccountActivationEmailAutomaticResentAsFormateur(user);
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

module.exports = resendActivationEmails;
