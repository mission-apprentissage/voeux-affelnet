const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const { DownloadType } = require("../common/constants/DownloadType");
const logger = require("../common/logger");
const { User /*, Responsable*/, Relation } = require("../common/model");

const {
  saveAccountConfirmationEmailAutomaticSent: saveAccountConfirmationEmailAutomaticSentToResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountConfirmationEmailAutomaticSent: saveAccountConfirmationEmailAutomaticSentToDelegue,
} = require("../common/actions/history/delegue");

const {
  saveAccountConfirmationEmailManualResent: saveAccountConfirmationEmailManualResentToResponsable,
  saveAccountConfirmationEmailAutomaticResent: saveAccountConfirmationEmailAutomaticResentToResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountConfirmationEmailManualResent: saveAccountConfirmationEmailManualResentToDelegue,
  saveAccountConfirmationEmailAutomaticResent: saveAccountConfirmationEmailAutomaticResentToDelegue,
} = require("../common/actions/history/delegue");

async function sendConfirmationEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: UserStatut.EN_ATTENTE,

          email: { $exists: true, $ne: null },
          // "emails.templateName": { $not: { $regex: "^confirmation_.*$" } },

          // TODO : Définir les règles pour trouver les utilisateurs à qui envoyer les mails de confirmations (User de type formateur ou responsable,
          // mais également qui ont des voeux et qui sont destinataires de ces voeux - diffusion autorisée ou responsable sans délégation)

          $or: [{ type: UserType.ETABLISSEMENT }, { type: UserType.DELEGUE }],
        }),
  };

  await User.find(query)
    .lean()
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      const type = user.type === UserType.ETABLISSEMENT ? DownloadType.RESPONSABLE : user.type;

      if (
        type === DownloadType.RESPONSABLE &&
        (await Relation.countDocuments({ "etablissement_responsable.uai": user.uai })) === 0
      ) {
        return;
      }

      const templateName = `confirmation_${(type?.toLowerCase() || "user").toLowerCase()}`;
      const previous = user.emails.find((email) => email.templateName === templateName);
      stats.total++;

      try {
        logger.info(
          `${previous ? "Res" : "S"}ending ${templateName} email to ${type} ${user.username} (${user.email})...`
        );
        previous ? await resendEmail(previous.token) : await sendEmail(user, templateName);

        switch (type) {
          case DownloadType.RESPONSABLE:
            switch (!!previous) {
              case false:
                await saveAccountConfirmationEmailAutomaticSentToResponsable(user);
                break;
              case true:
                options.sender
                  ? await saveAccountConfirmationEmailManualResentToResponsable(user, options.sender)
                  : await saveAccountConfirmationEmailAutomaticResentToResponsable(user);
                break;
            }
            break;
          case DownloadType.DELEGUE:
            switch (!!previous) {
              case false:
                await saveAccountConfirmationEmailAutomaticSentToDelegue(user);
                break;
              case true:
                options.sender
                  ? await saveAccountConfirmationEmailManualResentToDelegue(user, options.sender)
                  : await saveAccountConfirmationEmailAutomaticResentToDelegue(user);
                break;
            }
            break;
          default:
            break;
        }

        previous ? stats.resent++ : stats.sent++;
      } catch (e) {
        logger.error(`Unable to ${previous ? "re" : ""}sent ${templateName} email to ${type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendConfirmationEmails;
