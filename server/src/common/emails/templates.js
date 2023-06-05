const { createActionToken, createResetPasswordToken } = require("../utils/jwtUtils");
const path = require("path");

function getTemplateFile(name) {
  return path.join(__dirname, `${name}.mjml.ejs`);
}

const voeux_email = process.env.VOEUX_AFFELNET_EMAIL;

module.exports = {
  confirmation_gestionnaire: (gestionnaire, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2023 – Action requise pour la transmission des listes de candidats (Siret : ${gestionnaire.siret})`,
      templateFile: getTemplateFile("confirmation_gestionnaire"),
      data: {
        gestionnaire,
        token,
        actionToken: createActionToken(gestionnaire.username),
        voeux_email,
      },
    };
  },
  confirmation_formateur: (formateur, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2023 – Action requise pour la transmission des listes de candidats (UAI : ${formateur.uai})`,
      templateFile: getTemplateFile("confirmation_formateur"),
      data: {
        formateur,
        token,
        actionToken: createActionToken(formateur.username),
        voeux_email,
      },
    };
  },
  confirmed: (user) => {
    return {
      subject: `Affelnet 2023 – Confirmation de votre adresse courriel`,
      templateFile: getTemplateFile("confirmed"),
      data: {
        user,
        voeux_email,
      },
    };
  },
  activation_user: (user, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Diffusion des listes de candidats Affelnet : activation de votre compte administrateur`,
      templateFile: getTemplateFile("activation_user"),
      data: {
        user,
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
      },
    };
  },
  activation_academie: (user, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Diffusion des listes de candidats Affelnet : activation de votre compte académique`,
      templateFile: getTemplateFile("activation_academie"),
      data: {
        user,
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
      },
    };
  },
  activation_gestionnaire: (gestionnaire, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2023 – Veuillez activer votre compte pour l'accès aux listes de candidats (Siret : ${gestionnaire.siret})`,
      templateFile: getTemplateFile("activation_gestionnaire"),
      data: {
        gestionnaire,
        token,
        actionToken: createActionToken(gestionnaire.username),
        voeux_email,
      },
    };
  },
  activation_formateur: (formateur, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2023 – Veuillez activer votre compte pour l'accès aux listes de candidats (UAI : ${formateur.uai})`,
      templateFile: getTemplateFile("activation_formateur"),
      data: {
        formateur,
        token,
        actionToken: createActionToken(formateur.username),
        voeux_email,
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
        voeux_email,
      },
    };
  },
  notification_gestionnaire: (gestionnaire, token) => {
    return {
      subject: `Affelnet 2023 – Les listes de candidats à l’apprentissage sont téléchargeables (Siret : ${gestionnaire.siret})`,
      templateFile: getTemplateFile("notification_gestionnaire"),
      data: {
        gestionnaire,
        token,
        actionToken: createActionToken(gestionnaire.username),
        voeux_email,
      },
    };
  },
  notification_formateur: (formateur, token) => {
    return {
      subject: `Affelnet 2023 – La liste de candidats à l’apprentissage est téléchargeable (UAI : ${formateur.uai})`,
      templateFile: getTemplateFile("notification_formateur"),
      data: {
        formateur,
        token,
        actionToken: createActionToken(formateur.username),
        voeux_email,
      },
    };
  },
  reset_password: (user, token) => {
    return {
      subject: "Réinitialisation du mot de passe (lien valable 1 heure)",
      templateFile: getTemplateFile("reset_password"),
      data: {
        user,
        token,
        resetPasswordToken: createResetPasswordToken(user.username),
        voeux_email,
      },
    };
  },
};
