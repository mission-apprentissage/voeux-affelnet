const { createActionToken, createResetPasswordToken } = require("../utils/jwtUtils");
const path = require("path");

function getTemplateFile(name) {
  return path.join(__dirname, `${name}.mjml.ejs`);
}

module.exports = {
  confirmation: (cfa, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : ${cfa.siret})`,
      templateFile: getTemplateFile("confirmation"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
      },
    };
  },
  confirmation_voeux: (cfa, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : ${cfa.siret})`,
      templateFile: getTemplateFile("confirmation_voeux"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
      },
    };
  },
  confirmation_accepted: (cfa) => {
    return {
      subject: `Vœux Affelnet : l'adresse du directeur de l'établissement a bien été enregistrée`,
      templateFile: getTemplateFile("confirmation_accepted"),
      data: {
        cfa,
      },
    };
  },
  activation_user: (user, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Activation de votre compte`,
      templateFile: getTemplateFile("activation_user"),
      data: {
        user,
        token,
        actionToken: createActionToken(user.username),
      },
    };
  },
  activation_cfa: (cfa, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Des vœux Affelnet sont téléchargeables (Siret : ${cfa.siret})`,
      templateFile: getTemplateFile("activation_cfa"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
      },
    };
  },
  notification: (cfa, token) => {
    return {
      subject: `De nouveaux vœux Affelnet sont téléchargeables`,
      templateFile: getTemplateFile("notification"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
      },
    };
  },
  reset_password: (user, token) => {
    return {
      subject: "Réinitialisation du mot de passe",
      templateFile: getTemplateFile("reset_password"),
      data: {
        user,
        token,
        resetPasswordToken: createResetPasswordToken(user.username),
      },
    };
  },
};
