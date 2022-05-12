const { DateTime } = require("luxon");
const logger = require("../common/logger");
const { Cfa } = require("../common/model");

async function resendConfirmationEmails(emails, options = {}) {
  let stats = { total: 0, sent: 0, failed: 0 };
  let maxNbEmailsSent = options.max || 2;
  let query = {
    unsubscribe: false,
    statut: "en attente",
    ...(options.siret ? { siret: options.siret } : {}),
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
              ...(options.siret
                ? {}
                : {
                    error: { $exists: false },
                    $and: [
                      { sendDates: { $not: { $gt: DateTime.now().minus({ days: 7 }).toJSDate() } } },
                      { [`sendDates.${maxNbEmailsSent}`]: { $exists: false } },
                    ],
                  }),
            },
          },
        }),
  };

  stats.total = await Cfa.countDocuments(query);

  await Cfa.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (cfa) => {
      let previous = cfa.emails.find((e) => e.templateName.startsWith("confirmation"));
      let templateName = cfa.etablissements.find((e) => e.voeux_date) ? "confirmation_voeux" : previous.templateName;

      try {
        logger.info(`Resending ${templateName} to CFA ${cfa.siret}...`);
        await emails.resend(previous.token, { retry: options.retry, newTemplateName: templateName });
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${cfa.siret}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendConfirmationEmails;
