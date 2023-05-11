const { DateTime } = require("luxon");
const logger = require("../common/logger");
const { User, Gestionnaire } = require("../common/model");
const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const {
  saveAccountConfirmationEmailManualResent: saveAccountConfirmationEmailManualResentAsResponsable,
  saveAccountConfirmationEmailAutomaticResent: saveAccountConfirmationEmailAutomaticResentAsResponsable,
} = require("../common/actions/history/responsable");
// const {
//   saveAccountConfirmationEmailManualResent: saveAccountConfirmationEmailManualResentAsFormateur,
//   saveAccountConfirmationEmailAutomaticResent: saveAccountConfirmationEmailAutomaticResentAsFormateur,
// } = require("../common/actions/history/formateur");

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
                    "error.type": "fatal",
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

          $or: [{ type: UserType.GESTIONNAIRE }],
        }),
  };

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      const previous = user.emails.find((e) => e.templateName.startsWith("confirmation_"));

      if (user.type === UserType.FORMATEUR) {
        const gestionnaire = await Gestionnaire.findOne({ "etablissements.uai": user.username });

        const etablissement = gestionnaire.etablissements?.find(
          (etablissement) => etablissement.diffusionAutorisee && etablissement.uai === user.username
        );

        if (!etablissement) {
          return;
        }

        user.email = etablissement?.email;
      }

      try {
        logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
        await resendEmail(previous.token, { retry: options.retry, user });

        switch (user.type) {
          case UserType.GESTIONNAIRE:
            options.sender
              ? await saveAccountConfirmationEmailManualResentAsResponsable(user, options.sender)
              : await saveAccountConfirmationEmailAutomaticResentAsResponsable(user);
            break;
          // case UserType.FORMATEUR:
          //   options.sender
          //     ? await saveAccountConfirmationEmailManualResentAsFormateur(user, options.sender)
          //     : await saveAccountConfirmationEmailAutomaticResentAsFormateur(user);
          //   break;
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
