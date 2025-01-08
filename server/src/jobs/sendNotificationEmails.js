const { DownloadType } = require("../common/constants/DownloadType");
const logger = require("../common/logger");
const { Relation, Etablissement, Delegue } = require("../common/model");
// const { RelationActions } = require("../common/constants/History");

const {
  saveListAvailableEmailAutomaticSentToResponsable,
  saveListAvailableEmailManualSentToResponsable,
  saveListAvailableEmailAutomaticSentToDelegue,
  saveListAvailableEmailManualSentToDelegue,
} = require("../common/actions/history/relation");

async function sendNotificationEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0, skiped: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;
  let query;

  query = {
    $and: [
      { $expr: { $gt: ["$nombre_voeux", 0] } },
      { $expr: { $gt: ["$nombre_voeux_restant", 0] } },
      { $expr: { $eq: ["$nombre_voeux_restant", "$nombre_voeux"] } },
      { $expr: { $eq: ["$first_date_voeux", "$last_date_voeux"] } },
    ],
    // histories: {
    //   $not: {
    //     $elemMatch: {
    //       action: {
    //         $in: [
    //           RelationActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT_TO_RESPONSABLE,
    //           RelationActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_RESPONSABLE,
    //           RelationActions.LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT_TO_DELEGUE,
    //           RelationActions.LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_DELEGUE,
    //         ],
    //       },
    //     },
    //   },
    // },
  };

  await Relation.find(query)
    .lean()
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (relation) => {
      const responsable = await Etablissement.findOne({ uai: relation.etablissement_responsable.uai });
      const formateur = await Etablissement.findOne({ uai: relation.etablissement_formateur.uai });

      if (!responsable || !formateur) {
        stats.skiped++;
        logger.error("Responsable ou formateur manquant");
        return stats;
      }

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": relation.etablissement_responsable.uai,
            "etablissement_formateur.uai": relation.etablissement_formateur.uai,
            active: true,
          },
        },
      })
        .select({ _id: 0, histories: 0 })
        .lean();

      const user = delegue ?? responsable;

      if (!user) {
        logger.error("Utilisateur introuvable pour la relation " + relation._id);
        stats.skiped++;
        return stats;
        // throw Error("Utilisateur introuvable pour la relation " + relation._id);
      }

      if (!user.email) {
        logger.error("Absence d'adresse courriel pour l'utilisateur " + user._id);
        stats.skiped++;
        return stats;
        // throw Error("Absence d'adresse courriel pour l'utilisateur " + user._id);
      }

      const type = (delegue ? DownloadType.DELEGUE : DownloadType.RESPONSABLE).toLowerCase();

      const templateName = `notification_${type}`;
      const previous = user.emails.find(
        (e) =>
          e.templateName === templateName &&
          e.data?.relation?._id === relation._id &&
          e.data?.relation.last_date_voeux === relation.last_date_voeux
      );

      stats.total++;

      try {
        logger.info(
          `${previous ? "Res" : "S"}ending ${templateName} email to ${type} ${user.username} (${user.email})...`
        );

        switch (type) {
          case DownloadType.RESPONSABLE:
            previous
              ? await resendEmail(previous.token)
              : await sendEmail(user, templateName, {
                  relation,
                  responsable,
                  formateur,
                });
            options.sender
              ? await saveListAvailableEmailManualSentToResponsable({ relation, responsable }, options.sender)
              : await saveListAvailableEmailAutomaticSentToResponsable({ relation, responsable });
            break;

          case DownloadType.DELEGUE:
            previous
              ? await resendEmail(previous.token)
              : await sendEmail(user, templateName, {
                  relation,
                  responsable,
                  formateur,
                  delegue,
                });
            options.sender
              ? await saveListAvailableEmailManualSentToDelegue({ relation, delegue }, options.sender)
              : await saveListAvailableEmailAutomaticSentToDelegue({ relation, delegue });
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

module.exports = sendNotificationEmails;
