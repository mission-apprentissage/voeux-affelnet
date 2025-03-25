const { USER_STATUS } = require("../common/constants/UserStatus");
const { USER_TYPE } = require("../common/constants/UserType");
const { DOWNLOAD_TYPE } = require("../common/constants/DownloadType");
const logger = require("../common/logger");
const { User, Relation } = require("../common/model");

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
  const type = options.type;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,

          email: { $exists: true, $ne: null },

          statut: USER_STATUS.EN_ATTENTE,

          $and: [
            // { type: { $in: [USER_TYPE.ETABLISSEMENT, USER_TYPE.DELEGUE] } },
            ...(type ? [{ type }] : []),

            {
              $or: [
                {
                  "emails.templateName": { $not: /^confirmation_.*$/ },
                },
                {
                  emails: {
                    $elemMatch: {
                      templateName: /^confirmation_.*$/,
                      $or: [
                        {
                          sendDates: { $not: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) } },
                        },
                        {
                          error: { $exists: true },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        }),
  };

  await User.find(query)
    .lean()
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      const templateType = user.type === USER_TYPE.ETABLISSEMENT ? DOWNLOAD_TYPE.RESPONSABLE : user.type;

      if (
        templateType === DOWNLOAD_TYPE.RESPONSABLE &&
        (await Relation.countDocuments({ "etablissement_responsable.siret": user.siret })) === 0
      ) {
        return;
      }

      const templateName = `confirmation_${(templateType?.toLowerCase() || "user").toLowerCase()}`;
      const previous = user.emails.find((email) => email.templateName === templateName);
      stats.total++;

      try {
        logger.info(
          `${previous ? "Res" : "S"}ending ${templateName} email to ${templateType} ${user.username} (${user.email})...`
        );
        previous
          ? await resendEmail(previous.token, { retry: !!previous?.error })
          : await sendEmail(user, templateName);

        switch (templateType) {
          case DOWNLOAD_TYPE.RESPONSABLE:
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
          case DOWNLOAD_TYPE.DELEGUE:
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
        logger.error(
          `Unable to ${previous ? "re" : ""}sent ${templateName} email to ${templateType} ${user.username}`,
          e
        );
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendConfirmationEmails;
