const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const { DownloadType } = require("../common/constants/DownloadType");
const logger = require("../common/logger");
const { User, Relation } = require("../common/model");

const {
  saveAccountActivationEmailAutomaticSent: saveAccountActivationEmailAutomaticSentToResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountActivationEmailAutomaticSent: saveAccountActivationEmailAutomaticSentToDelegue,
} = require("../common/actions/history/delegue");

const {
  saveAccountActivationEmailManualResent: saveAccountActivationEmailManualResentToResponsable,
  saveAccountActivationEmailAutomaticResent: saveAccountActivationEmailAutomaticResentToResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountActivationEmailManualResent: saveAccountActivationEmailManualResentToDelegue,
  saveAccountActivationEmailAutomaticResent: saveAccountActivationEmailAutomaticResentToDelegue,
} = require("../common/actions/history/delegue");

async function sendActivationEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          $or: [{ password: { $exists: false } }, { password: null }],
          statut: UserStatut.CONFIRME,
          "emails.templateName": { $not: { $regex: "^activation_.*$" } },
        }),
  };

  await User.find(query)
    .lean()
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      // console.log({ user });

      const type = user.type === UserType.ETABLISSEMENT ? DownloadType.RESPONSABLE : user.type;

      if (
        type === DownloadType.RESPONSABLE &&
        (await Relation.countDocuments({ "etablissement_responsable.uai": user.uai })) === 0
      ) {
        return;
      }

      const templateName =
        user.isAdmin && user.academie?.code
          ? `activation_academie`
          : `activation_${(type?.toLowerCase() || "user").toLowerCase()}`;
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
                await saveAccountActivationEmailAutomaticSentToResponsable(user);
                break;
              case true:
                options.sender
                  ? await saveAccountActivationEmailManualResentToResponsable(user, options.sender)
                  : await saveAccountActivationEmailAutomaticResentToResponsable(user);
                break;
            }
            break;
          case DownloadType.DELEGUE:
            switch (!!previous) {
              case false:
                await saveAccountActivationEmailAutomaticSentToDelegue(user);
                break;
              case true:
                options.sender
                  ? await saveAccountActivationEmailManualResentToDelegue(user, options.sender)
                  : await saveAccountActivationEmailAutomaticResentToDelegue(user);
                break;
            }
            break;
          default:
            break;
        }

        previous ? stats.resent++ : stats.sent++;
      } catch (e) {
        logger.error(`Unable to ${previous ? "re" : ""}sent ${templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendActivationEmails;
