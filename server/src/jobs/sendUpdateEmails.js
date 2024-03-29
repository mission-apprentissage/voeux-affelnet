const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");
const { User, Gestionnaire } = require("../common/model");
const { allFilesAsAlreadyBeenDownloaded, filesHaveUpdate } = require("../common/utils/dataUtils");

const {
  saveUpdatedListAvailableEmailAutomaticSent: saveUpdatedListAvailableEmailAutomaticSentForResponsable,
} = require("../common/actions/history/responsable");
const {
  saveUpdatedListAvailableEmailAutomaticSent: saveUpdatedListAvailableEmailAutomaticSentForFormateur,
} = require("../common/actions/history/formateur");

async function sendNotificationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: { $nin: [UserStatut.NON_CONCERNE] },

          "etablissements.voeux_date": { $exists: true },
          "emails.templateName": { $not: { $regex: "^update_.*$" } },

          $or: [
            {
              type: UserType.GESTIONNAIRE,
              etablissements: {
                $elemMatch: { diffusionAutorisee: false, voeux_date: { $exists: true }, nombre_voeux: { $gt: 0 } },
              },
            },
            { type: UserType.FORMATEUR },
          ],
        }),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      if (user.type === UserType.FORMATEUR) {
        const gestionnaire = await Gestionnaire.findOne({
          "etablissements.uai": user.username,
          "etablissements.diffusionAutorisee": true,
        });

        if (!gestionnaire) {
          return;
        }

        const etablissement = gestionnaire.etablissements?.find(
          (etablissement) => etablissement.diffusionAutorisee && etablissement.uai === user.username
        );

        user.email = user.email || etablissement?.email;
      }

      if (await allFilesAsAlreadyBeenDownloaded(user)) {
        return;
      }

      if (await !filesHaveUpdate(user)) {
        return;
      }

      const templateName = `update_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

      try {
        if (limit > stats.sent) {
          logger.info(`Sending ${templateName} email to ${user.type} ${user.username}...`);
          await sendEmail(user, templateName);

          switch (user.type) {
            case UserType.GESTIONNAIRE:
              await saveUpdatedListAvailableEmailAutomaticSentForResponsable(user);
              break;
            case UserType.FORMATEUR:
              await saveUpdatedListAvailableEmailAutomaticSentForFormateur(user);
              break;
            default:
              break;
          }

          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to sent ${templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendNotificationEmails;
