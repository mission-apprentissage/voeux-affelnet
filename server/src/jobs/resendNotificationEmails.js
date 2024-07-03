const logger = require("../common/logger");
const { DateTime } = require("luxon");
const { User, Responsable, Relation, Delegue } = require("../common/model");
const { UserStatut } = require("../common/constants/UserStatut");
const { allFilesAsAlreadyBeenDownloaded, filesHaveUpdate } = require("../common/utils/dataUtils");
const { UserType } = require("../common/constants/UserType");

const {
  saveListAvailableEmailManualResent: saveListAvailableEmailManualResentAsResponsable,
  saveListAvailableEmailAutomaticResent: saveListAvailableEmailAutomaticResentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveListAvailableEmailManualResent: saveListAvailableEmailManualResentAsDelegue,
  saveListAvailableEmailAutomaticResent: saveListAvailableEmailAutomaticResentAsDelegue,
} = require("../common/actions/history/delegue");

async function resendNotificationEmails(resendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;
  let query;

  if (options.username && options.force) {
    query = { username: options.username };
  } else {
    const relations = await Relation.find({
      // $and: [
      //   // { $expr: { $gt: ["$nombre_voeux", 0] } },
      //   // { $expr: { $gt: ["$nombre_voeux_restant", 0] } },
      //   // { $expr: { $eq: ["$nombre_voeux_restant", "$nombre_voeux"] } },
      //   // { $expr: { $eq: ["$first_date_voeux", "$last_date_voeux"] } },
      // ],
    });
    // console.log(relations);

    const delegues = (
      (await Promise.all(
        relations.map(
          async (relation) =>
            await Delegue.findOne({
              type: UserType.DELEGUE,
              relations: {
                $elemMatch: {
                  "etablissement_responsable.siret": relation.etablissement_responsable.siret,
                  "etablissement_formateur.uai": relation.etablissement_formateur.uai,
                  active: true,
                },
              },
            })
        )
      )) ?? []
    )
      .filter((delegue) => !!delegue)
      .reduce((acc, delegue) => {
        if (!acc.find((d) => d.email === delegue.email)) {
          acc.push(delegue);
        }

        return acc;
      }, []);

    const relationsDeleguees = delegues.flatMap((delegue) => delegue.relations.filter((relation) => relation.active));

    const relationsNonDeleguees = relations.filter(
      (relation) =>
        !relationsDeleguees.find(
          (relationDeleguee) =>
            relationDeleguee.etablissement_responsable.siret === relation.etablissement_responsable.siret &&
            relationDeleguee.etablissement_formateur.uai === relation.etablissement_formateur.uai
        )
    );

    const responsables = await Responsable.find({
      siret: { $in: relationsNonDeleguees.map((relation) => relation.etablissement_responsable.siret) },
    });

    query = {
      ...(options.username ? { username: options.username } : {}),
      ...(options.force
        ? {}
        : {
            unsubscribe: false,
            statut: { $nin: [UserStatut.NON_CONCERNE] },

            $or: [
              {
                type: UserType.RESPONSABLE,
                _id: { $in: responsables.map((responsable) => responsable._id) },
              },
              { type: UserType.DELEGUE, _id: { $in: delegues.map((delegue) => delegue._id) } },
            ],

            "emails.templateName": { $not: { $regex: "^update_.*$" } },

            ...(options.retry
              ? {
                  emails: {
                    $elemMatch: {
                      templateName: /^notification_.*/,
                      "error.type": { $in: ["fatal", "soft_bounce"] },
                    },
                  },
                }
              : {
                  emails: {
                    $elemMatch: {
                      templateName: /^notification_.*/,
                      error: { $exists: false },
                      $and: [
                        { sendDates: { $not: { $gt: DateTime.now().minus({ days: 7 }).toJSDate() } } },
                        { "sendDates.2": { $exists: false } },
                      ],
                    },
                  },
                }),
          }),
    };
  }

  // const query = {
  //   ...(options.username ? { username: options.username } : {}),
  //   ...(options.force
  //     ? {}
  //     : {
  //         unsubscribe: false,
  //         statut: { $nin: [UserStatut.NON_CONCERNE] },

  //         "etablissements.voeux_date": { $exists: true },

  //         ...(options.retry
  //           ? {
  //               emails: {
  //                 $elemMatch: {
  //                   templateName: /^notification_.*/,
  //                   "error.type": { $in: ["fatal", "soft_bounce"] },
  //                 },
  //               },
  //             }
  //           : {
  //               emails: {
  //                 $elemMatch: {
  //                   templateName: /^notification_.*/,
  //                   error: { $exists: false },
  //                   $and: [
  //                     { sendDates: { $not: { $gt: DateTime.now().minus({ days: 1 }).toJSDate() } } },
  //                     { "sendDates.2": { $exists: false } },
  //                   ],
  //                 },
  //               },
  //             }),
  //       }),
  // };

  await User.find(query)
    .lean()
    // .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      if (!options.force && (await allFilesAsAlreadyBeenDownloaded(user))) {
        return;
      }

      if (!options.force && (await filesHaveUpdate(user))) {
        return;
      }

      const previous = user.emails.find((e) => e.templateName.startsWith("notification_"));
      stats.total++;

      try {
        if (limit > stats.sent) {
          logger.info(`Resending ${previous.templateName} email to ${user.type} ${user.username}...`);
          await resendEmail(previous.token);

          switch (user.type) {
            case UserType.RESPONSABLE:
              options.sender
                ? await saveListAvailableEmailManualResentAsResponsable(user, options.sender)
                : await saveListAvailableEmailAutomaticResentAsResponsable(user);
              break;

            case UserType.DELEGUE:
              options.sender
                ? await saveListAvailableEmailManualResentAsDelegue(user, options.sender)
                : await saveListAvailableEmailAutomaticResentAsDelegue(user);
              break;
            default:
              break;
          }

          stats.sent++;
        }
      } catch (e) {
        logger.error(`Unable to resent ${previous.templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = resendNotificationEmails;
