const { User } = require("../model");
const Boom = require("boom");
const { changeEmail } = require("./changeEmail");

async function confirm(username, email, options = {}) {
  const user = await User.findOne({ username });
  const isNewEmail = user.email !== email;

  if (!email || (!options.force && user.statut !== "en attente")) {
    throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le compte ${username}`);
  }

  if (isNewEmail) {
    await changeEmail(username, email);
  }

  return User.findOneAndUpdate(
    { username },
    {
      $set: {
        statut: "confirmé",
      },
    },
    { new: true }
  ).lean();
}

module.exports = { confirm };
