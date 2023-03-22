const { DateTime } = require("luxon");
const logger = require("../common/logger");
const { Gestionnaire } = require("../common/model");

async function resendConfirmationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const maxNbEmailsSent = options.max || 2;
  const query = {
    unsubscribe: false,
    statut: "en attente",
    ...(options.username ? { username: options.username } : {}),
    ...(options.retry
      ? {
          emails: {
            $elemMatch: {
              templateName: /^confirmation.*/,
              "error.type": "fatal",
            },
          },
        }
      : {
          emails: {
            $elemMatch: {
              templateName: /^confirmation.*/,
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
  };

  stats.total = await Gestionnaire.countDocuments(query);

  await Gestionnaire.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (gestionnaire) => {
      const previous = gestionnaire.emails.find((e) => e.templateName.startsWith("confirmation_"));

      try {
        logger.info(`Resending ${previous.templateName} to CFA ${gestionnaire.username}...`);
        await resendEmail(previous.token, { retry: options.retry });
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${gestionnaire.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendConfirmationEmails;
