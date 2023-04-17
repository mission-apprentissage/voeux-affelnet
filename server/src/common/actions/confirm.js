const { User } = require("../model");
const Boom = require("boom");

const { changeEmail } = require("./changeEmail");
const { removePassword } = require("./removePassword");
const { getUser } = require("./getUser");
const { UserStatut } = require("../constants/UserStatut");

async function confirm(username, email, options = {}) {
  const user = await getUser(username);
  const isNewEmail = user.email !== email;

  if (!email || (!options.force && user.statut !== UserStatut.EN_ATTENTE)) {
    throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le compte ${username}`);
  }

  if (isNewEmail) {
    await changeEmail(username, email, { auteur: username });
  }

  if (user.password) {
    await removePassword(username);
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
