const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");
const { User, Responsable, Relation, Delegue } = require("../common/model");
const { allFilesAsAlreadyBeenDownloaded, filesHaveUpdate } = require("../common/utils/dataUtils");

const {
  saveListAvailableEmailAutomaticSent: saveListAvailableEmailAutomaticSentForResponsable,
  saveListAvailableEmailManualSent: saveListAvailableEmailManualSentForResponsable,
} = require("../common/actions/history/responsable");
const {
  saveListAvailableEmailAutomaticSent: saveListAvailableEmailAutomaticSentForDelegue,
  saveListAvailableEmailManualSent: saveListAvailableEmailManualSentForDelegue,
} = require("../common/actions/history/delegue");

async function sendNotificationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

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

  logger.info(`Sending notification emails to ${responsables.length} responsables and ${delegues.length} delegues...`);

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: { $nin: [UserStatut.NON_CONCERNE] },

          $and: [
            { "emails.templateName": { $not: { $regex: "^notification_.*$" } } },
            { "emails.templateName": { $not: { $regex: "^update_.*$" } } },
          ],

          $or: [
            {
              type: UserType.RESPONSABLE,
              _id: { $in: responsables.map((responsable) => responsable._id) },
            },
            { type: UserType.DELEGUE, _id: { $in: delegues.map((delegue) => delegue._id) } },
          ],
        }),
  };

  await User.find(query)
    .lean()
    // .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      if (!options.force && (await allFilesAsAlreadyBeenDownloaded(user))) {
        // console.log("allFilesAsAlreadyBeenDownloaded");
        return;
      }

      if (!options.force && (await filesHaveUpdate(user))) {
        // console.log("filesHaveUpdate");
        return;
      }

      const templateName = `notification_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

      try {
        if (limit > stats.sent) {
          logger.info(`Sending ${templateName} email to ${user.type} ${user.username}...`);
          await sendEmail(user, templateName);

          switch (user.type) {
            case UserType.RESPONSABLE:
              options.sender
                ? await saveListAvailableEmailManualSentForResponsable(user, options.sender)
                : await saveListAvailableEmailAutomaticSentForResponsable(user);
              break;

            case UserType.DELEGUE:
              options.sender
                ? await saveListAvailableEmailManualSentForDelegue(user, options.sender)
                : await saveListAvailableEmailAutomaticSentForDelegue(user);
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
