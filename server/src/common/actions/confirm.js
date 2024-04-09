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
  saveAccountConfirmed: saveAccountConfirmedAsFormateur,
  saveAccountEmailUpdatedByAccount: saveAccountEmailUpdatedByAccountAsFormateur,
} = require("./history/formateur");
const { UserType } = require("../constants/UserType");

async function confirm(username, email, options = {}) {
  const user = await getUser(username);
  const isNewEmail = user.email !== email;

  if (!email || (!options.force && user.statut !== UserStatut.EN_ATTENTE)) {
    throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le compte ${username}`);
  }

  if (isNewEmail) {
    await changeEmail(username, email, { auteur: username });

    switch (user.type) {
      case UserType.RESPONSABLE:
        await saveAccountEmailUpdatedByAccountAsResponsable({ siret: user.username, email }, user.email);
        break;
      case UserType.FORMATEUR:
        await saveAccountEmailUpdatedByAccountAsFormateur({ uai: user.username, email }, user.email);
        break;
    }
  }

  if (user.password) {
    await removePassword(username);
  }

  switch (user.type) {
    case UserType.RESPONSABLE:
      await saveAccountConfirmedAsResponsable({ siret: user.username, email });
      break;
    case UserType.FORMATEUR:
      await saveAccountConfirmedAsFormateur({ uai: user.username, email });
      break;
    default:
      break;
  }

  return User.findOneAndUpdate(
    { username },
    {
      $set: {
        statut: UserStatut.CONFIRME,
      },
    },
    { new: true }
  ).lean();
}

module.exports = { confirm };
