const { USER_STATUS } = require("../common/constants/UserStatus");
const { USER_TYPE } = require("../common/constants/UserType");
const { CONTACT_TYPE } = require("../common/constants/ContactType");
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
  const type = options.type;
  const resend = options.resend || false;
  const proceed = typeof options.proceed !== "undefined" ? options.proceed : true;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,

          email: { $exists: true, $ne: null },

          $or: [{ password: { $exists: false } }, { password: null }],

          statut: USER_STATUS.CONFIRME,

          $and: [
            ...(type ? [{ type }] : []),

            {
              $or: [
                {
                  "emails.templateName": { $not: /^activation_.*$/ },
                },
                {
                  emails: {
                    $elemMatch: {
                      templateName: /^activation_.*$/,
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
      // console.log({ user });

      const templateType = user.type === USER_TYPE.ETABLISSEMENT ? CONTACT_TYPE.RESPONSABLE : user.type;

      if (
        templateType === CONTACT_TYPE.RESPONSABLE &&
        (await Relation.countDocuments({ "etablissement_responsable.siret": user.siret })) === 0
      ) {
        return;
      }

      const templateName = `activation_${(templateType?.toLowerCase() || "user").toLowerCase()}`;
      const previous = user.emails.find((e) => e.templateName === templateName && e.data?.email === user.email);

      if (previous && !previous.error && !resend) {
        return;
      }

      stats.total++;

      switch (true) {
        case proceed: {
          try {
            previous
              ? await resendEmail(previous.token, { retry: !!previous?.error })
              : await sendEmail(user, templateName, {
                  email: user.email,
                });

            switch (templateType) {
              case CONTACT_TYPE.RESPONSABLE:
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
              case CONTACT_TYPE.DELEGUE:
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

            logger.info(
              `[DONE] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${user.username} (${
                user.email
              })...`
            );

            previous ? stats.resent++ : stats.sent++;
          } catch (e) {
            logger.error(
              `[ERROR] ${previous ? "Res" : "S"}end ${templateName} email to ${user.type} ${user.username}`,
              e
            );
            stats.failed++;
          }
          break;
        }

        default: {
          logger.info(
            `[TODO] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${user.username} (${
              user.email
            })...`
          );
          previous ? stats.resent++ : stats.sent++;
          break;
        }
      }
    });

  if (!proceed) {
    logger.warn(`TO PROCEED USE --proceed OPTION`);
  }

  return stats;
}

module.exports = sendActivationEmails;
