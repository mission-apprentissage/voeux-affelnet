const logger = require("../common/logger");
const { Cfa } = require("../common/model");

async function sendConfirmationEmails(emails, options = {}) {
  let stats = { total: 0, sent: 0, failed: 0 };
  let query = {
    unsubscribe: false,
    statut: "en attente",
    emails: { $not: { $elemMatch: { templateName: /^confirmation_.*/ } } },
  };

  stats.total = await Cfa.countDocuments(query);

  await Cfa.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (cfa) => {
      try {
        let templateName = cfa.email_source === "directeur" ? "confirmation_directeur" : "confirmation_contact";
        logger.info(`Sending ${templateName} to cfa ${cfa.username}...`);
        await emails.send(cfa, templateName);
        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent email to ${cfa.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendConfirmationEmails;
