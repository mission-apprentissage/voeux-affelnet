const {
  saveAccountConfirmationEmailAutomaticSent: saveAccountConfirmationEmailAutomaticSentAsResponsable,
} = require("../common/actions/history/responsable");
const {
  saveAccountConfirmationEmailAutomaticSent: saveAccountConfirmationEmailAutomaticSentAsFormateur,
} = require("../common/actions/history/formateur");
const { UserStatut } = require("../common/constants/UserStatut");
const { UserType } = require("../common/constants/UserType");
const logger = require("../common/logger");
const { User, Gestionnaire } = require("../common/model");

async function sendConfirmationEmails(sendEmail, options = {}) {
  const stats = { total: 0, sent: 0, failed: 0 };
  const limit = options.limit || Number.MAX_SAFE_INTEGER;

  const query = {
    ...(options.username ? { username: options.username } : {}),
    ...(options.force
      ? {}
      : {
          unsubscribe: false,
          statut: UserStatut.EN_ATTENTE,

          "emails.templateName": { $not: { $regex: "^confirmation_.*$" } },

          // TODO : Définir les règles pour trouver les utilisateurs à qui envoyer les mails de confirmations (User de type formateur ou gestionnaire,
          // mais également qui ont des voeux et qui sont destinataires de ces voeux - diffusion autorisée ou gestionnaire sans délégation)

          $or: [{ type: UserType.GESTIONNAIRE }],
        }),
  };

  await User.find(query)
    .lean()
    .limit(limit)
    .cursor()
    .eachAsync(async (user) => {
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

      const templateName = `confirmation_${(user.type?.toLowerCase() || "user").toLowerCase()}`;
      stats.total++;

      try {
        logger.info(`Sending ${templateName} email to ${user.type} ${user.username}...`);
        await sendEmail(user, templateName);

        switch (user.type) {
          case UserType.GESTIONNAIRE:
            await saveAccountConfirmationEmailAutomaticSentAsResponsable(user);
            break;
          case UserType.FORMATEUR:
            await saveAccountConfirmationEmailAutomaticSentAsFormateur(user);
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

module.exports = sendConfirmationEmails;
