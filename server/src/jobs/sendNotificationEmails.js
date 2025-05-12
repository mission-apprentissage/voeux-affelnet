const { CONTACT_TYPE } = require("../common/constants/ContactType");
const logger = require("../common/logger");
const { Relation, Etablissement, Delegue } = require("../common/model");
// const { RelationActions } = require("../common/constants/History");
const {
  saveListAvailableEmailAutomaticSentToResponsable,
  saveListAvailableEmailAutomaticResentToResponsable,
  saveListAvailableEmailManualSentToResponsable,
  saveListAvailableEmailAutomaticSentToDelegue,
  saveListAvailableEmailAutomaticResentToDelegue,
  saveListAvailableEmailManualSentToDelegue,
} = require("../common/actions/history/relation");
const { pick } = require("lodash");

async function sendNotificationEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0, skiped: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;
  const type = options.type;
  const username = options.username;
  const proceed = typeof options.proceed !== "undefined" ? options.proceed : true;

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

  await Relation.find(query, { _id: 0, histories: 0 })
    .lean()
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (relation) => {
      if (!relation.etablissement_responsable.siret || !relation.etablissement_formateur.siret) {
        stats.skiped++;
        logger.error("Relation incomplète");
        return stats;
      }

      const responsable = await Etablissement.findOne({ siret: relation.etablissement_responsable.siret });
      const formateur = await Etablissement.findOne({ siret: relation.etablissement_formateur.siret });

      if (!responsable || !formateur) {
        stats.skiped++;
        logger.error("Responsable ou formateur manquant");
        return stats;
      }

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

      if (username && user.username !== username) {
        return;
      }

      if (type && user.type !== type) {
        return;
      }

      if (!user) {
        logger.error("Utilisateur introuvable pour la relation " + relation._id);
        stats.skiped++;
        return stats;
      }

      if (!user.email) {
        logger.error("Absence d'adresse courriel pour l'utilisateur " + user._id);
        stats.skiped++;
        return stats;
      }

      const templateType = (delegue ? CONTACT_TYPE.DELEGUE : CONTACT_TYPE.RESPONSABLE).toLowerCase();

      const templateName = `notification_relation_${templateType}`;
      const previous = user.emails?.find((e) => {
        return (
          e.templateName === templateName &&
          e.data?.relation?.etablissement_responsable.siret === relation.etablissement_responsable.siret &&
          e.data?.relation?.etablissement_formateur.siret === relation.etablissement_formateur.siret &&
          e.data?.relation?.nombre_voeux === relation.nombre_voeux &&
          new Date(e.data?.relation?.last_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime()
        );
      });

      stats.total++;

      switch (true) {
        case proceed: {
          try {
            switch (templateType) {
              case CONTACT_TYPE.RESPONSABLE.toLowerCase():
                {
                  const data = {
                    relation,
                    responsable: pick(responsable, [
                      "_id",
                      "siret",
                      "username",
                      "libelle_ville",
                      "uai",
                      "raison_sociale",
                      "enseigne",
                    ]),
                    formateur: pick(formateur, [
                      "_id",
                      "siret",
                      "username",
                      "libelle_ville",
                      "uai",
                      "raison_sociale",
                      "enseigne",
                    ]),
                  };

                  previous
                    ? await resendEmail(previous.token, { retry: !!previous?.error })
                    : await sendEmail(user, templateName, data);
                  options.sender
                    ? await saveListAvailableEmailManualSentToResponsable(data, options.sender)
                    : previous
                    ? await saveListAvailableEmailAutomaticResentToResponsable(data)
                    : await saveListAvailableEmailAutomaticSentToResponsable(data);
                }
                break;

              case CONTACT_TYPE.DELEGUE.toLowerCase():
                {
                  const data = {
                    relation,
                    responsable: pick(responsable, [
                      "_id",
                      "siret",
                      "username",
                      "libelle_ville",
                      "uai",
                      "raison_sociale",
                      "enseigne",
                    ]),
                    formateur: pick(formateur, [
                      "_id",
                      "siret",
                      "username",
                      "libelle_ville",
                      "uai",
                      "raison_sociale",
                      "enseigne",
                    ]),
                    delegue: pick(delegue, ["_id", "username", "email"]),
                  };

                  previous
                    ? await resendEmail(previous.token, { retry: !!previous?.error })
                    : await sendEmail(user, templateName, data);
                  options.sender
                    ? await saveListAvailableEmailManualSentToDelegue(data, options.sender)
                    : previous
                    ? await saveListAvailableEmailAutomaticResentToDelegue(data)
                    : await saveListAvailableEmailAutomaticSentToDelegue(data);
                }
                break;

              default:
                console.log("Unknown template type", templateType);
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
              `[ERROR] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${user.username}`,
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

module.exports = sendNotificationEmails;
