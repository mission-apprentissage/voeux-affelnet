const { createActionToken, createResetPasswordToken } = require("../utils/jwtUtils");
const path = require("path");

function getTemplateFile(name) {
  return path.join(__dirname, `${name}.mjml.ejs`);
}

module.exports = {
  confirmation_gestionnaire: (gestionnaire, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des vœux 2023 (SIRET : ${gestionnaire.siret})`,
      templateFile: getTemplateFile("confirmation_gestionnaire"),
      data: {
        gestionnaire,
        token,
        actionToken: createActionToken(gestionnaire.username),
      },
    };
  },
  confirmation_formateur: (formateur, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des vœux 2023 (UAI : ${formateur.uai})`,
      templateFile: getTemplateFile("confirmation_formateur"),
      data: {
        formateur,
        token,
        actionToken: createActionToken(formateur.username),
      },
    };
  },
  confirmed: (user) => {
    return {
      subject: `Vœux Affelnet : l'adresse du destinataire des vœux a bien été enregistrée`,
      templateFile: getTemplateFile("confirmed"),
      data: {
        user,
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
  activation_gestionnaire: (gestionnaire, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Des vœux Affelnet sont téléchargeables (SIRET : ${gestionnaire.siret})`,
      templateFile: getTemplateFile("activation_gestionnaire"),
      data: {
        gestionnaire,
        token,
        actionToken: createActionToken(gestionnaire.username),
      },
    };
  },
  activation_formateur: (formateur, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Activation de votre compte`,
      templateFile: getTemplateFile("activation_formateur"),
      data: {
        formateur,
        token,
        actionToken: createActionToken(formateur.username),
      },
    };
  },
  activation_csaio: (csaio, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Activation de votre compte`,
      templateFile: getTemplateFile("activation_csaio"),
      data: {
        csaio,
        token,
        actionToken: createActionToken(csaio.username),
      },
    };
  },
  notification_gestionnaire: (gestionnaire, token) => {
    return {
      subject: `De nouveaux vœux Affelnet sont téléchargeables`,
      templateFile: getTemplateFile("notification_gestionnaire"),
      data: {
        gestionnaire,
        token,
        actionToken: createActionToken(gestionnaire.username),
      },
    };
  },
  notification_formateur: (formateur, token) => {
    return {
      subject: `De nouveaux vœux Affelnet sont téléchargeables`,
      templateFile: getTemplateFile("notification_formateur"),
      data: {
        formateur,
        token,
        actionToken: createActionToken(formateur.username),
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
