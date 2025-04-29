const { USER_STATUS } = require("../common/constants/UserStatus");
const { USER_TYPE } = require("../common/constants/UserType");
const { CONTACT_TYPE } = require("../common/constants/ContactType");
const logger = require("../common/logger");
const { User, Relation, Etablissement, Delegue } = require("../common/model");

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

const relationPipelines = [
  {
    $lookup: {
      from: Etablissement.collection.name,
      localField: "etablissement_formateur.siret",
      foreignField: "siret",
      as: "formateur",
      pipeline: [
        {
          $project: {
            _id: 0,
            siret: 1,
            uai: 1,
            academie: 1,
            raison_sociale: 1,
            libelle_ville: 1,
            enseigne: 1,
            statut: 1,
          },
        },
      ],
    },
  },
  {
    $lookup: {
      from: Etablissement.collection.name,
      localField: "etablissement_responsable.siret",
      foreignField: "siret",
      as: "responsable",
      pipeline: [
        {
          $project: {
            _id: 0,
            siret: 1,
            uai: 1,
            academie: 1,
            raison_sociale: 1,
            libelle_ville: 1,
            enseigne: 1,
            statut: 1,
          },
        },
      ],
    },
  },
  {
    $lookup: {
      from: Etablissement.collection.name,
      localField: "etablissement_responsable.siret",
      foreignField: "siret",
      as: "responsable",
      pipeline: [
        {
          $project: {
            _id: 0,
            siret: 1,
            uai: 1,
            academie: 1,
            raison_sociale: 1,
            libelle_ville: 1,
            enseigne: 1,
            statut: 1,
          },
        },
      ],
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
                // { $eq: ["$relations.active", true] },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            root: {
              $first: "$$ROOT",
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$root",
          },
        },
        {
          $project: { _id: 0, email: 1, statut: 1 },
        },
      ],
      as: "delegue",
    },
  },

  {
    $unwind: {
      path: "$responsable",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $unwind: {
      path: "$formateur",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $unwind: {
      path: "$delegue",
      preserveNullAndEmptyArrays: true,
    },
  },

  { $project: { _id: 0, academie: 1, responsable: 1, formateur: 1, delegue: 1 } },
];

async function sendConfirmationEmails({ sendEmail, resendEmail }, options = {}) {
  const stats = { total: 0, sent: 0, resent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  const skip = options.skip || 0;
  const type = options.type;
  const proceed = typeof options.proceed !== "undefined" ? options.proceed : true;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,

          email: { $exists: true, $ne: null },

          statut: USER_STATUS.EN_ATTENTE,

          $and: [
            { type: { $in: [USER_TYPE.ETABLISSEMENT, USER_TYPE.DELEGUE] } },
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
      const templateType = user.type === USER_TYPE.ETABLISSEMENT ? CONTACT_TYPE.RESPONSABLE : user.type;

      if (
        templateType === CONTACT_TYPE.RESPONSABLE &&
        (await Relation.countDocuments({ "etablissement_responsable.siret": user.siret })) === 0
      ) {
        return;
      }

      const templateName = `confirmation_${(templateType?.toLowerCase() || "user").toLowerCase()}`;
      const previous = user.emails.find((e) => e.templateName === templateName && e.data?.email === user.email);

      stats.total++;

      switch (true) {
        case proceed: {
          try {
            let relations;

            if (templateType === CONTACT_TYPE.DELEGUE) {
              relations = await Promise.all(
                user.relations.map(
                  async (relation) =>
                    (
                      await Relation.aggregate([
                        {
                          $match: {
                            "etablissement_responsable.siret": relation.etablissement_responsable.siret,
                            "etablissement_formateur.siret": relation.etablissement_formateur.siret,
                          },
                        },
                        ...relationPipelines,
                      ])
                    )[0]
                )
              );
            } else if (templateType === CONTACT_TYPE.RESPONSABLE) {
              relations = await Relation.aggregate([
                {
                  $match: {
                    "etablissement_responsable.siret": user.siret,
                  },
                },
                ...relationPipelines,
              ]);
            }

            previous
              ? await resendEmail(previous.token, { retry: !!previous?.error })
              : await sendEmail({ ...user, relations }, templateName, {
                  email: user.email,
                });

            switch (templateType) {
              case CONTACT_TYPE.RESPONSABLE:
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
              case CONTACT_TYPE.DELEGUE:
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

module.exports = sendConfirmationEmails;
