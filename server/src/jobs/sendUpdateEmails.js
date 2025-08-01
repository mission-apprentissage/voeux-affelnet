const { CONTACT_TYPE } = require("../common/constants/ContactType");
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
const { pick } = require("lodash");

async function sendUpdateEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;
  const type = options.type;
  const resend = options.resend || false;
  const username = options.username;
  const proceed = typeof options.proceed !== "undefined" ? options.proceed : true;
  const force = options.force || false;
  const siret_responsable = options.siret_responsable;
  const siret_formateur = options.siret_formateur;

  let query;

  force
    ? (query = {
        ...(siret_responsable ? { "etablissement_responsable.siret": options.siret_responsable } : {}),
        ...(siret_formateur ? { "etablissement_formateur.siret": options.siret_formateur } : {}),
      })
    : (query = {
        $and: [
          { $expr: { $gt: ["$nombre_voeux", 0] } },
          { $expr: { $gt: ["$nombre_voeux_restant", 0] } },
          // { $expr: { $eq: ["$nombre_voeux_restant", "$nombre_voeux"] } },
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
      });

  await Relation.find(query, { histories: 0 })
    .lean()
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (relation) => {
      const responsable = await Etablissement.findOne({ siret: relation.etablissement_responsable.siret });
      const formateur = await Etablissement.findOne({ siret: relation.etablissement_formateur.siret });

      if (!responsable || !formateur) {
        stats.skiped++;
        logger.error(
          `[ERROR] Responsable ou formateur manquant pour la relation ${relation.etablissement_responsable.siret} / ${relation.etablissement_formateur.siret}`
        );
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

      if (type && user.type !== type) {
        return;
      }

      if (username && user.username !== username) {
        return;
      }

      if (!user) {
        logger.error(
          `[ERROR] Utilisateur introuvable pour la relation ${relation.etablissement_responsable.siret} / ${relation.etablissement_formateur.siret}`
        );
        stats.skiped++;
        return stats;
      }

      if (!user.email) {
        logger.error(
          `[ERROR] Absence d'adresse courriel pour l'utilisateur ${user.username} pour la relation ${relation.etablissement_responsable.siret} / ${relation.etablissement_formateur.siret}`
        );
        stats.skiped++;
        return stats;
      }

      const templateType = (delegue ? CONTACT_TYPE.DELEGUE : CONTACT_TYPE.RESPONSABLE).toLowerCase();

      const templateName = `update_relation_${templateType}`;

      const previous = user.emails?.find((e) => {
        return (
          e.templateName === templateName &&
          e.data?.relation?.etablissement_responsable.siret === relation.etablissement_responsable.siret &&
          e.data?.relation?.etablissement_formateur.siret === relation.etablissement_formateur.siret &&
          e.data?.relation?.nombre_voeux === relation.nombre_voeux &&
          new Date(e.data?.relation?.last_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime()
        );
      });

      if (previous && !previous.error && !resend && !force) {
        return;
      }

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
                      "email",
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
                  switch (!!previous) {
                    case false:
                      await sendEmail(user, templateName, data);
                      options.sender
                        ? await saveUpdatedListAvailableEmailManualSentToResponsable(data, options.sender)
                        : await saveUpdatedListAvailableEmailAutomaticSentToResponsable(data);
                      break;
                    case true:
                      await resendEmail(previous.token, { retry: !!previous?.error });
                      options.sender
                        ? await saveUpdatedListAvailableEmailManualResentToResponsable(data, options.sender)
                        : await saveUpdatedListAvailableEmailAutomaticResentToResponsable(data);
                      break;
                  }
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
                      "email",
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
                  switch (!!previous) {
                    case false:
                      await sendEmail(user, templateName, data);
                      options.sender
                        ? await saveUpdatedListAvailableEmailManualSentToDelegue(data, options.sender)
                        : await saveUpdatedListAvailableEmailAutomaticSentToDelegue(data);
                      break;

                    case true:
                      await resendEmail(previous.token, { retry: !!previous?.error });
                      options.sender
                        ? await saveUpdatedListAvailableEmailManualResentToDelegue(data, options.sender)
                        : await saveUpdatedListAvailableEmailAutomaticResentToDelegue(data);

                      break;
                  }
                }
                break;
            }

            logger.info(
              `[DONE] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${user.username} (${
                user.email
              }) for formateur ${formateur.siret}...`
            );

            previous ? stats.resent++ : stats.sent++;
          } catch (e) {
            logger.error(
              `[ERROR] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${
                user.username
              } for formateur ${formateur.siret}`,
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
            }) for formateur ${formateur.siret}...`
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

module.exports = sendUpdateEmails;
