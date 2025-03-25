const { DOWNLOAD_TYPE } = require("../common/constants/DownloadType");
const logger = require("../common/logger");
const { Relation, Etablissement, Delegue } = require("../common/model");
// const { RelationActions } = require("../common/constants/History");

const {
  saveUpdatedListAvailableEmailAutomaticSentToResponsable,
  saveUpdatedListAvailableEmailManualSentToResponsable,
  saveUpdatedListAvailableEmailAutomaticSentToDelegue,
  saveUpdatedListAvailableEmailManualSentToDelegue,
  saveUpdatedListAvailableEmailAutomaticResentToResponsable,
  saveUpdatedListAvailableEmailManualResentToResponsable,
  saveUpdatedListAvailableEmailAutomaticResentToDelegue,
  saveUpdatedListAvailableEmailManualResentToDelegue,
} = require("../common/actions/history/relation");

async function sendUpdateEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;
  const type = options.type;
  let query;

  query = {
    $and: [
      { $expr: { $gt: ["$nombre_voeux", 0] } },
      { $expr: { $gt: ["$nombre_voeux_restant", 0] } },
      { $expr: { $eq: ["$nombre_voeux_restant", "$nombre_voeux"] } },
      { $expr: { $ne: ["$first_date_voeux", "$last_date_voeux"] } },
    ],
    // histories: {
    //   $not: {
    //     $elemMatch: {
    //       action: {
    //         $in: [
    //           RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT_TO_RESPONSABLE,
    //           RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_RESPONSABLE,
    //           RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_AUTOMATIC_SENT_TO_DELEGUE,
    //           RelationActions.UPDATED_LIST_AVAILABLE_EMAIL_MANUAL_SENT_TO_DELEGUE,
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
      const responsable = await Etablissement.findOne({ siret: relation.etablissement_responsable.siret });
      const formateur = await Etablissement.findOne({ siret: relation.etablissement_formateur.siret });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": relation.etablissement_responsable.siret,
            "etablissement_formateur.siret": relation.etablissement_formateur.siret,
            active: true,
          },
        },
      })
        .select({ _id: 0, histories: 0 })
        .lean();

      const user = delegue ?? responsable;

      if (type && user.type !== type) {
        return;
      }

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

      const templateType = (delegue ? DOWNLOAD_TYPE.DELEGUE : DOWNLOAD_TYPE.RESPONSABLE).toLowerCase();

      const templateName = `update_${templateType}`;
      const previous = user.emails.find(
        (e) =>
          e.templateName === templateName &&
          e.data.relation?._id === relation._id &&
          e.data.relation?.last_date_voeux === relation.last_date_voeux
      );
      stats.total++;

      try {
        logger.info(
          `${previous ? "Res" : "S"}ending ${templateName} email to ${templateType} ${user.username} (${user.email})...`
        );

        switch (templateType) {
          case DOWNLOAD_TYPE.RESPONSABLE.toLowerCase():
            switch (!!previous) {
              case false:
                await sendEmail(user, templateName, {
                  relation,
                  responsable,
                  formateur,
                });
                options.sender
                  ? await saveUpdatedListAvailableEmailManualSentToResponsable(
                      { relation, responsable, formateur },
                      options.sender
                    )
                  : await saveUpdatedListAvailableEmailAutomaticSentToResponsable({
                      relation,
                      responsable,
                      formateur,
                    });
                break;
              case true:
                await resendEmail(previous.token);
                options.sender
                  ? await saveUpdatedListAvailableEmailManualResentToResponsable(
                      { relation, responsable, formateur },
                      options.sender
                    )
                  : await saveUpdatedListAvailableEmailAutomaticResentToResponsable({
                      relation,
                      responsable,
                      formateur,
                    });
                break;
            }
            break;
          case DOWNLOAD_TYPE.DELEGUE.toLowerCase():
            switch (!!previous) {
              case false:
                await sendEmail(user, templateName, {
                  relation,
                  responsable,
                  formateur,
                  delegue,
                });
                options.sender
                  ? await saveUpdatedListAvailableEmailManualSentToDelegue(
                      { relation, responsable, formateur, delegue },
                      options.sender
                    )
                  : await saveUpdatedListAvailableEmailAutomaticSentToDelegue({
                      relation,
                      responsable,
                      formateur,
                      delegue,
                    });
                break;

              case true:
                await resendEmail(previous.token);
                options.sender
                  ? await saveUpdatedListAvailableEmailManualResentToDelegue(
                      { relation, responsable, formateur, delegue },
                      options.sender
                    )
                  : await saveUpdatedListAvailableEmailAutomaticResentToDelegue({
                      relation,
                      responsable,
                      formateur,
                      delegue,
                    });

                break;
            }
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

module.exports = sendUpdateEmails;
