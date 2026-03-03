const logger = require("../common/logger");
const { Relation, Etablissement, Delegue } = require("../common/model");
// const { RelationActions } = require("../common/constants/History");

// const {
//   saveInactiveDelegueWarningEmailAutomaticSentToResponsable,
//   saveInactiveDelegueWarningEmailManualSentToResponsable,
//   saveInactiveDelegueWarningEmailAutomaticSentToDelegue,
//   saveInactiveDelegueWarningEmailManualSentToDelegue,
//   saveInactiveDelegueWarningEmailAutomaticResentToResponsable,
//   saveInactiveDelegueWarningEmailManualResentToResponsable,
//   saveInactiveDelegueWarningEmailAutomaticResentToDelegue,
//   saveInactiveDelegueWarningEmailManualResentToDelegue,
// } = require("../common/actions/history/relation");
const { pick } = require("lodash");
const { USER_TYPE } = require("../common/constants/UserType");

async function sendWarningEmails(
  {
    sendEmail,
    // resendEmail
  },
  options = {}
) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;
  // const resend = options.resend || false;
  const username = options.username;
  const proceed = typeof options.proceed !== "undefined" ? options.proceed : true;
  // const force = options.force || false;

  await Etablissement.aggregate(
    [
      { $match: { type: USER_TYPE.ETABLISSEMENT } },
      {
        $lookup: {
          from: Relation.collection.name,
          let: { siret_responsable: "$siret" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                    { $gt: ["$nombre_voeux", 0] },
                    { $eq: ["$nombre_voeux_restant", "$nombre_voeux"] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: Delegue.collection.name,
                let: {
                  siret_responsable: "$etablissement_responsable.siret",
                  siret_formateur: "$etablissement_formateur.siret",
                },
                pipeline: [
                  {
                    $match: {
                      type: USER_TYPE.DELEGUE,
                    },
                  },
                  {
                    $unwind: {
                      path: "$relations",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$relations.etablissement_responsable.siret", "$$siret_responsable"] },
                          { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                          { $eq: ["$relations.active", true] },
                        ],
                      },
                    },
                  },
                  { $project: { _id: 0, histories: 0 } },
                ],
                as: "delegue",
              },
            },
            {
              $unwind: {
                path: "$delegue",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                delegue: { $exists: true },
              },
            },
          ],
          as: "relations",
        },
      },
      {
        $match: {
          "relations.delegue": { $exists: true },
        },
      },
      ...(username ? [{ $match: { username } }] : []),
      { $skip: skip },
      { $limit: limit },
    ],
    { histories: 0 }
  )
    .skip(skip)
    .limit(limit)
    .cursor()
    .eachAsync(async (responsable) => {
      // console.log(etablissement);
      const delegues = responsable.relations
        .filter((relation) => !!relation.delegue)
        .map((relation) => relation.delegue)
        .flat();

      // if (delegues.length === 0) {
      //   return;
      // }

      logger.info(
        `Etablissement ${responsable.siret} a ${delegues.length} délégué(s) inactif(s) [${delegues
          .map((d) => d?.username)
          .join(", ")}]`
      );

      const user = responsable;

      if (!user.email) {
        logger.error(`[ERROR] Absence d'adresse courriel pour l'utilisateur ${user.username}`);
        stats.skiped++;
        return stats;
      }

      const templateName = `warning_inactive_delegues`;

      // const previous = user.emails?.find((e) => {
      //   return (
      //     e.templateName === templateName &&
      //     e.data?.relation?.etablissement_responsable.siret === relation.etablissement_responsable.siret &&
      //     e.data?.relation?.etablissement_formateur.siret === relation.etablissement_formateur.siret &&
      //     e.data?.relation?.nombre_voeux === relation.nombre_voeux &&
      //     new Date(e.data?.relation?.last_date_voeux).getTime() === new Date(relation.last_date_voeux).getTime()
      //   );
      // });

      // if (previous && !previous.error && !resend && !force) {
      //   return;
      // }

      stats.total++;

      await sendEmail(user, templateName, {
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
        relations: responsable.relations,
        delegues: delegues,
      });

      // switch (true) {
      //   case proceed: {
      //     try {
      //       switch (templateType) {
      //         case CONTACT_TYPE.RESPONSABLE.toLowerCase():
      //           {
      //             const data = {
      //               relation,
      //               responsable: pick(responsable, [
      //                 "_id",
      //                 "siret",
      //                 "username",
      //                 "email",
      //                 "libelle_ville",
      //                 "uai",
      //                 "raison_sociale",
      //                 "enseigne",
      //               ]),
      //               formateur: pick(formateur, [
      //                 "_id",
      //                 "siret",
      //                 "username",
      //                 "libelle_ville",
      //                 "uai",
      //                 "raison_sociale",
      //                 "enseigne",
      //               ]),
      //             };
      //             switch (!!previous) {
      //               case false:
      //                 await sendEmail(user, templateName, data);
      //                 options.sender
      //                   ? await saveUpdatedListAvailableEmailManualSentToResponsable(data, options.sender)
      //                   : await saveUpdatedListAvailableEmailAutomaticSentToResponsable(data);
      //                 break;
      //               case true:
      //                 await resendEmail(previous.token, { retry: !!previous?.error });
      //                 options.sender
      //                   ? await saveUpdatedListAvailableEmailManualResentToResponsable(data, options.sender)
      //                   : await saveUpdatedListAvailableEmailAutomaticResentToResponsable(data);
      //                 break;
      //             }
      //           }

      //           break;
      //         case CONTACT_TYPE.DELEGUE.toLowerCase():
      //           {
      //             const data = {
      //               relation,
      //               responsable: pick(responsable, [
      //                 "_id",
      //                 "siret",
      //                 "username",
      //                 "email",
      //                 "libelle_ville",
      //                 "uai",
      //                 "raison_sociale",
      //                 "enseigne",
      //               ]),
      //               formateur: pick(formateur, [
      //                 "_id",
      //                 "siret",
      //                 "username",
      //                 "libelle_ville",
      //                 "uai",
      //                 "raison_sociale",
      //                 "enseigne",
      //               ]),
      //               delegue: pick(delegue, ["_id", "username", "email"]),
      //             };
      //             switch (!!previous) {
      //               case false:
      //                 await sendEmail(user, templateName, data);
      //                 options.sender
      //                   ? await saveUpdatedListAvailableEmailManualSentToDelegue(data, options.sender)
      //                   : await saveUpdatedListAvailableEmailAutomaticSentToDelegue(data);
      //                 break;

      //               case true:
      //                 await resendEmail(previous.token, { retry: !!previous?.error });
      //                 options.sender
      //                   ? await saveUpdatedListAvailableEmailManualResentToDelegue(data, options.sender)
      //                   : await saveUpdatedListAvailableEmailAutomaticResentToDelegue(data);

      //                 break;
      //             }
      //           }
      //           break;
      //       }

      //       logger.info(
      //         `[DONE] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${user.username} (${
      //           user.email
      //         }) for formateur ${formateur.siret}...`
      //       );

      //       previous ? stats.resent++ : stats.sent++;
      //     } catch (e) {
      //       logger.error(
      //         `[ERROR] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${
      //           user.username
      //         } for formateur ${formateur.siret}`,
      //         e
      //       );
      //       stats.failed++;
      //     }
      //     break;
      //   }

      //   default: {
      //     logger.info(
      //       `[TODO] ${previous ? "Res" : "S"}end ${templateName} email to ${templateType} ${user.username} (${
      //         user.email
      //       }) for formateur ${formateur.siret}...`
      //     );
      //     previous ? stats.resent++ : stats.sent++;
      //     break;
      //   }
      // }
    });

  if (!proceed) {
    logger.warn(`TO PROCEED USE --proceed OPTION`);
  }

  return stats;
}

module.exports = sendWarningEmails;
