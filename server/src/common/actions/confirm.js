const { User } = require("../model");
const Boom = require("boom");

const { changeEmail } = require("./changeEmail");
const { removePassword } = require("./removePassword");
const { getUser } = require("./getUser");
const { UserStatut } = require("../constants/UserStatut");
const {
  saveAccountConfirmed: saveAccountConfirmedAsResponsable,
  saveAccountEmailUpdatedByAccount: saveAccountEmailUpdatedByAccountAsResponsable,
} = require("./history/responsable");
const {
  saveAccountConfirmed: saveAccountConfirmedAsDelegue,
  saveAccountEmailUpdatedByAccount: saveAccountEmailUpdatedByAccountAsDelegue,
} = require("./history/delegue");
const { UserType } = require("../constants/UserType");

async function confirm(username, email, options = {}) {
  const user = await getUser(username);
  const isNewEmail = user.email !== email;
  const oldEmail = user.email;

  if (!email || (!options.force && user.statut !== UserStatut.EN_ATTENTE)) {
    throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le compte ${username}`);
  }

  if (isNewEmail) {
    await changeEmail(username, email, { auteur: username });

    switch (user.type) {
      case UserType.RESPONSABLE:
        await saveAccountEmailUpdatedByAccountAsResponsable(user, email, oldEmail);
        break;
      case UserType.DELEGUE:
        await saveAccountEmailUpdatedByAccountAsDelegue(user, email, oldEmail);
        break;
    }
  }

  if (user.password) {
    await removePassword(username);
  }

  switch (user.type) {
    case UserType.RESPONSABLE:
      await saveAccountConfirmedAsResponsable(user, email);
      break;
    case UserType.DELEGUE:
      await saveAccountConfirmedAsDelegue(user, email);
      break;
    default:
      break;
  }

  return User.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        statut: UserStatut.CONFIRME,
      },
    },
    { new: true }
  ).lean();
}

module.exports = { confirm };
