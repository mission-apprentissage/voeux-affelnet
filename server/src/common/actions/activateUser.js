const { User } = require("../model");
const sha512Utils = require("../utils/passwordUtils");
const { saveAccountActivated: saveResponsableAccountActivated } = require("./history/responsable");
const { saveAccountActivated: saveFormateurAccountActivated } = require("./history/formateur");
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
    case UserType.FORMATEUR:
      await saveFormateurAccountActivated(user);
      break;
    default:
      break;
  }

  return user;
}

module.exports = { activateUser };
