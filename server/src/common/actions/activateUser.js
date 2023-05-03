const { User } = require("../model");
const sha512Utils = require("../utils/passwordUtils");
const { saveAccountActivated: saveGestionnaireAccountActivated } = require("./history/responsable");
const { saveAccountActivated: saveFormateurAccountActivated } = require("./history/formateur");

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
    case "Gestionnaire":
      await saveGestionnaireAccountActivated(user);
      break;
    case "Formateur":
      await saveFormateurAccountActivated(user);
      break;
    default:
      break;
  }

  return user;
}

module.exports = { activateUser };
