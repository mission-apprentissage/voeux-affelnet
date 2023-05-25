const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");
const { User, Gestionnaire } = require("../common/model");
const {
  saveAccountActivationEmailAutomaticSent: saveAccountActivationEmailAutomaticSentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountActivationEmailAutomaticSent: saveAccountActivationEmailAutomaticSentAsFormateur,
} = require("../common/actions/history/formateur");

async function sendActivationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          $or: [{ password: { $exists: false } }, { password: null }],
          statut: UserStatut.CONFIRME,
          "emails.templateName": { $not: { $regex: "^activation_.*$" } },
          // $or: [
          //   { type: UserType.GESTIONNAIRE },
          //   { type: UserType.FORMATEUR },
          //   { type: { $nin: [UserType.FORMATEUR, UserType.GESTIONNAIRE] } },
          // ],
        }),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
      console.log({ user });

      const templateName =
        user.isAdmin && user.academie?.code
          ? `activation_academie`
          : `activation_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

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

        user.email = etablissement?.email;
      }

      try {
        logger.info(`Sending ${templateName} email to ${user.type} ${user.username}...`);
        await sendEmail(user, templateName);

        switch (user.type) {
          case UserType.GESTIONNAIRE:
            await saveAccountActivationEmailAutomaticSentAsResponsable(user);
            break;
          case UserType.FORMATEUR:
            await saveAccountActivationEmailAutomaticSentAsFormateur(user);
            break;
          default:
            break;
        }

        stats.sent++;
      } catch (e) {
        logger.error(`Unable to sent ${templateName} email to ${user.type} ${user.username}`, e);
        stats.failed++;
      }
    });

  return stats;
}

module.exports = sendActivationEmails;
