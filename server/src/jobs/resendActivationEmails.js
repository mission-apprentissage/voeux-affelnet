const { DateTime } = require("luxon");
const logger = require("../common/logger");
const { User } = require("../common/model");

async function resendActivationEmails(emails, options = {}) {
  let stats = { total: 0, sent: 0, failed: 0 };
  let maxNbEmailsSent = options.max || 2;
  let query = {
    unsubscribe: false,
    password: { $exists: false },
    statut: "confirmé",
    ...(options.username ? { username: options.username } : {}),
    ...(options.retry
      ? {
          emails: {
            $elemMatch: {
              templateName: "activation",
              "error.type": "fatal",
            },
          },
        }
      : {
          emails: {
            $elemMatch: {
              templateName: "activation",
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

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      let previous = user.emails.find((e) => e.templateName === "activation");

      try {
        logger.info(`Resending activation to user ${user.username}...`);
        await emails.resend(previous.token);
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendActivationEmails;
