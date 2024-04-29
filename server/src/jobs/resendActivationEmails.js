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
  saveAccountActivationEmailManualResent: saveAccountActivationEmailManualResentAsDelegue,
  saveAccountActivationEmailAutomaticResent: saveAccountActivationEmailAutomaticResentAsDelegue,
} = require("../common/actions/history/delegue");

async function resendActivationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const maxNbEmailsSent = options.max || 2;
  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          $or: [{ password: { $exists: false } }, { password: null }],
          statut: UserStatut.CONFIRME,
          ...(options.retry
            ? {
                emails: {
                  $elemMatch: {
                    templateName: /^activation_.*/,
                    "error.type": { $in: ["fatal", "soft_bounce"] },
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

          type: { $in: [UserType.DELEGUE, UserType.RESPONSABLE] },

          // $or: [
          //   { type: UserType.RESPONSABLE },
          //   { type: UserType.FORMATEUR },
          //   // { type: { $nin: [UserType.FORMATEUR, UserType.RESPONSABLE] } },
          // ],
        }),
  };

  stats.total = await User.countDocuments(query);

  await User.find(query)
    .lean()
    .limit(options.limit || Number.MAX_SAFE_INTEGER)
    .cursor()
    .eachAsync(async (user) => {
      const previous = user.emails.find((e) => e.templateName.startsWith("activation_"));

      // if (user.type === UserType.FORMATEUR) {
      //   const responsable = await Responsable.findOne({
      //     "etablissements.uai": user.username,
      //     "etablissements.diffusion_autorisee": true,
      //   });

      //   if (!responsable) {
      //     return;
      //   }

      //   const etablissement = responsable.etablissements_formateur?.find(
      //     (etablissement) => etablissement.diffusion_autorisee && etablissement.uai === user.username
      //   );

      //   user.email = etablissement?.email;
      // }

      try {
        logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
        await resendEmail(previous.token, { retry: options.retry, user });

        switch (user.type) {
          case UserType.RESPONSABLE:
            options.sender
              ? await saveAccountActivationEmailManualResentAsResponsable(user, options.sender)
              : await saveAccountActivationEmailAutomaticResentAsResponsable(user);
            break;
          case UserType.DELEGUE:
            options.sender
              ? await saveAccountActivationEmailManualResentAsDelegue(user, options.sender)
              : await saveAccountActivationEmailAutomaticResentAsDelegue(user);
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
