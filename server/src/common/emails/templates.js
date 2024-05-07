const { createActionToken, createResetPasswordToken } = require("../utils/jwtUtils");
const path = require("path");

function getTemplateFile(name) {
  return path.join(__dirname, `${name}.mjml.ejs`);
}

const voeux_email = process.env.VOEUX_AFFELNET_EMAIL;

module.exports = {
  confirmation_responsable: (responsable, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2024  – Action requise pour la transmission des listes de candidats (Siret : ${responsable.siret})`,
      templateFile: getTemplateFile("confirmation_responsable"),
      data: {
        responsable,
        token,
        actionToken: createActionToken(responsable.username),
        voeux_email,
      },
    };
  },
  confirmation_delegue: (delegue, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2024  – Action requise pour la transmission des listes de candidats`,
      templateFile: getTemplateFile("confirmation_delegue"),
      data: {
        delegue,
        token,
        actionToken: createActionToken(delegue.username),
        voeux_email,
      },
    };
  },
  confirmed: (user) => {
    return {
      subject: `Affelnet 2024  – Confirmation de votre adresse courriel`,
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
  activation_responsable: (responsable, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2024  – Veuillez activer votre compte pour l'accès aux listes de candidats (Siret : ${responsable.siret})`,
      templateFile: getTemplateFile("activation_responsable"),
      data: {
        responsable,
        token,
        actionToken: createActionToken(responsable.username),
        voeux_email,
      },
    };
  },
  activation_delegue: (delegue, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet 2024  – Veuillez activer votre compte pour l'accès aux listes de candidats`,
      templateFile: getTemplateFile("activation_delegue"),
      data: {
        delegue,
        token,
        actionToken: createActionToken(delegue.username),
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
  notification_responsable: (responsable, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2024  – Les listes de candidats à l’apprentissage sont téléchargeables (Siret : ${responsable.siret})`,
      templateFile: getTemplateFile("notification_responsable"),
      data: {
        responsable,
        token,
        actionToken: createActionToken(responsable.username),
        voeux_email,
      },
    };
  },
  notification_delegue: (delegue, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2024  – La liste de candidats à l’apprentissage est téléchargeable`,
      templateFile: getTemplateFile("notification_delegue"),
      data: {
        delegue,
        token,
        actionToken: createActionToken(delegue.username),
        voeux_email,
      },
    };
  },
  update_responsable: (responsable, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2024  – Les listes de candidats à l’apprentissage ont été mises à jour (Siret : ${responsable.siret})`,
      templateFile: getTemplateFile("update_responsable"),
      data: {
        responsable,
        token,
        actionToken: createActionToken(responsable.username),
        voeux_email,
      },
    };
  },
  update_delegue: (delegue, token, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2024  – Les listes de candidats à l’apprentissage ont été mises à jour (UAI : ${delegue.uai})`,
      templateFile: getTemplateFile("update_delegue"),
      data: {
        delegue,
        token,
        actionToken: createActionToken(delegue.username),
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
