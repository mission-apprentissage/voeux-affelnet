const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");
const { User, Responsable, Relation, Delegue } = require("../common/model");
const { allFilesAsAlreadyBeenDownloaded, filesHaveUpdate } = require("../common/utils/dataUtils");

const {
  saveListAvailableEmailAutomaticSent: saveListAvailableEmailAutomaticSentForResponsable,
} = require("../common/actions/history/responsable");
// const {
//   saveListAvailableEmailAutomaticSent: saveListAvailableEmailAutomaticSentForFormateur,
// } = require("../common/actions/history/formateur");
const {
  saveListAvailableEmailAutomaticSent: saveListAvailableEmailAutomaticSentForDelegue,
} = require("../common/actions/history/delegue");

async function sendNotificationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const responsables = await Responsable.aggregate([
    { $match: { type: UserType.RESPONSABLE } },
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
                  // { $gt: ["$nombre_voeux", 0] },
                  // { $gt: ["$nombre_voeux_restant", 0] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: Delegue.collection.name,
              let: {
                siret_responsable: "$etablissement_responsable.siret",
                uai_formateur: "$etablissement_formateur.uai",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                        { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
                        { $eq: ["$active", true] },
                      ],
                    },
                  },
                },
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
        ],
        as: "relations",
      },
    },
    { $match: { "relations.0": { $exists: true }, "relations.delegue": null } },
  ]);

  const delegues = await Delegue.aggregate([
    { $match: { type: UserType.DELEGUE, "relations.active": true } },
    {
      $lookup: {
        from: Relation.collection.name,
        let: { uai_formateur: "$uai", siret_responsable: "$siret" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
                  { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                  // { $gt: ["$nombre_voeux", 0] },
                  // { $gt: ["$nombre_voeux_restant", 0] },
                ],
              },
            },
          },
        ],
        as: "relations",
      },
    },
    { $match: { "relations.0": { $exists: true } } },
  ]);

  logger.info(`Sending notification emails to ${responsables.length} responsables and ${delegues.length} delegues...`);

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: { $nin: [UserStatut.NON_CONCERNE] },

          // "etablissements.voeux_date": { $exists: true },
          "emails.templateName": { $not: { $regex: "^notification_.*$" } },

          // TODO : Vérifier si il y'a délégation ou non pour savoir à qui envoyer les mails de notifications
          $or: [
            {
              type: UserType.RESPONSABLE,
              _id: { $in: responsables.map((responsable) => responsable._id) },
            },
            // { type: UserType.FORMATEUR },
            { type: UserType.DELEGUE, _id: { $in: delegues.map((delegue) => delegue._id) } },
          ],
        }),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      // if (user.type === UserType.FORMATEUR) {
      //   const responsable = await Responsable.findOne({
      //     "etablissements.uai": user.username,
      //     "etablissements.diffusion_autorisee": true,
      //   });

      //   if (!responsable) {
      //     return;
      //   }

      //   const etablissement = responsable.etablissements_formateur?.find(
      //     (etablissement) => etablissement.diffusion_autorisee && etablissement.uai === user.username
      //   );

      //   user.email = user.email || etablissement?.email;
      // }

      if (await allFilesAsAlreadyBeenDownloaded(user)) {
        return;
      }

      if (await filesHaveUpdate(user)) {
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
              await saveListAvailableEmailAutomaticSentForResponsable(user);
              break;
            // case UserType.FORMATEUR:
            //   await saveListAvailableEmailAutomaticSentForFormateur(user);
            //   break;
            case UserType.DELEGUE:
              await saveListAvailableEmailAutomaticSentForDelegue(user);
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
