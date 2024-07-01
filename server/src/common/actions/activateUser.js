const { User } = require("../model");
const sha512Utils = require("../utils/passwordUtils");
const { saveAccountActivated: saveResponsableAccountActivated } = require("./history/responsable");
const { saveAccountActivated: saveDelegueAccountActivated } = require("./history/delegue");
const { UserType } = require("../constants/UserType");

async function activateUser(username, password, options = {}) {
  const user = await User.findOneAndUpdate(
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

  switch (user.type) {
    case UserType.RESPONSABLE:
      await saveResponsableAccountActivated(user);
      break;
    case UserType.DELEGUE:
      await saveDelegueAccountActivated(user);
      break;
    default:
      break;
  }

  return user;
}

module.exports = { activateUser };
