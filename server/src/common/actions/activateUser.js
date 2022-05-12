const { User } = require("../model");
const sha512Utils = require("../utils/passwordUtils");

async function activateUser(username, password, options = {}) {
  let user = await User.findOneAndUpdate(
    { username },
    {
      $set: {
        statut: "activé",
        password: options.hash || sha512Utils.hash(password),
      },
    },
    { new: true }
  ).lean();

  if (!user) {
    throw new Error(`Utilisateur ${username} inconnu`);
  }

  return user;
}

module.exports = { activateUser };
