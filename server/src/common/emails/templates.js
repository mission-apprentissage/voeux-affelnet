const { createActionToken, createResetPasswordToken } = require("../utils/jwtUtils");
const path = require("path");

function getTemplateFile(name) {
  return path.join(__dirname, `${name}.mjml.ejs`);
}

module.exports = {
  confirmation: (cfa, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : ${cfa.siret})`,
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
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : ${cfa.siret})`,
      templateFile: getTemplateFile("confirmation_voeux"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
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
  activation_cfa: (user, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Des voeux Affelnet sont téléchargeables`,
      templateFile: getTemplateFile("activation_cfa"),
      data: {
        user,
        token,
        actionToken: createActionToken(user.username),
      },
    };
  },
  notification: (cfa, token) => {
    return {
      subject: `De nouveaux voeux Affelnet sont téléchargeables`,
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
