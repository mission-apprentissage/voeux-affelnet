const { createActionToken, createResetPasswordToken } = require("../utils/jwtUtils");
const path = require("path");

function getTemplateFile(name) {
  return path.join(__dirname, `${name}.mjml.ejs`);
}

const voeux_email = process.env.VOEUX_AFFELNET_EMAIL;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  confirmation_responsable: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – Action requise pour la transmission des listes de candidats aux offres de formation en apprentissage (UAI : ${user.uai})`,
      templateFile: getTemplateFile("confirmation_responsable"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        responsable: user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  confirmation_delegue: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – Action requise pour la transmission des listes de candidats`,
      templateFile: getTemplateFile("confirmation_delegue"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        delegue: user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  confirmed: (user, token, variables = {}) => {
    return {
      subject: `Affelnet 2025 – Confirmation de votre adresse courriel`,
      templateFile: getTemplateFile("confirmed"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  activation_admin: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Diffusion des listes de candidats Affelnet : activation de votre compte administrateur`,
      templateFile: getTemplateFile("activation_admin"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  activation_academie: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Diffusion des listes de candidats Affelnet : activation de votre compte académique`,
      templateFile: getTemplateFile("activation_academie"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  activation_responsable: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – Veuillez activer votre compte pour l'accès aux listes de candidats (UAI : ${user.uai})`,
      templateFile: getTemplateFile("activation_responsable"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        responsable: user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  activation_delegue: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – Veuillez activer votre compte pour l'accès aux listes de candidats aux offres de formation en apprentissage`,
      templateFile: getTemplateFile("activation_delegue"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        delegue: user,
      },
    };
  },
  // eslint-disable-next-line no-unused-vars
  activation_csaio: (user, token, variables = {}, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Activation de votre compte`,
      templateFile: getTemplateFile("activation_csaio"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        csaio: user,
      },
    };
  },

  // notification_responsable: (user, token, { relation, responsable, formateur }, options = {}) => {
  //   const prefix = options.resend ? "[Rappel] " : "";

  //   return {
  //     subject: `${prefix}Affelnet 2025 – Les listes de candidats à l’apprentissage sont téléchargeables`,
  //     templateFile: getTemplateFile("notification_responsable"),
  //     data: {
  //       token,
  //       actionToken: createActionToken(user.username),
  //       voeux_email,
  //       relation,
  //       responsable,
  //       formateur,
  //     },
  //   };
  // },

  // notification_delegue: (user, token, { relation, responsable, formateur, delegue }, options = {}) => {
  //   const prefix = options.resend ? "[Rappel] " : "";

  //   console.log({ relation, responsable, formateur, delegue });
  //   return {
  //     subject: `${prefix}Affelnet 2025 – Les listes de candidats à l’apprentissage sont téléchargeables`,
  //     templateFile: getTemplateFile("notification_delegue"),
  //     data: {
  //       token,
  //       actionToken: createActionToken(user.username),
  //       voeux_email,
  //       relation,
  //       responsable,
  //       formateur,
  //       delegue,
  //     },
  //   };
  // },

  notification_relation_responsable: (user, token, { relation, responsable, formateur, delegue }, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – La liste de candidats à l’apprentissage pour l'établissement ${formateur.uai} est téléchargeable`,
      templateFile: getTemplateFile("notification_relation_responsable"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        relation,
        responsable,
        formateur,
        delegue,
      },
    };
  },
  notification_relation_delegue: (user, token, { relation, responsable, formateur }, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – La liste de candidats à l’apprentissage pour l'établissement ${formateur.uai} est téléchargeable`,
      templateFile: getTemplateFile("notification_relation_delegue"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        relation,
        responsable,
        formateur,
      },
    };
  },

  update_responsable: (user, token, { relation, responsable, formateur }, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – Les listes de candidats à l’apprentissage pour l'établissement ${formateur.uai} ont été mises à jour`,
      templateFile: getTemplateFile("update_responsable"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        relation,
        responsable,
        formateur,
      },
    };
  },
  update_delegue: (user, token, { relation, responsable, formateur, delegue }, options = {}) => {
    const prefix = options.resend ? "[Rappel] " : "";

    return {
      subject: `${prefix}Affelnet 2025 – Les listes de candidats à l’apprentissage pour l'établissement ${formateur.uai} ont été mises à jour`,
      templateFile: getTemplateFile("update_delegue"),
      data: {
        token,
        actionToken: createActionToken(user.username),
        voeux_email,
        relation,
        responsable,
        formateur,
        delegue,
      },
    };
  },
  reset_password: (user, token) => {
    return {
      subject: "Réinitialisation du mot de passe (lien valable 2 heures)",
      templateFile: getTemplateFile("reset_password"),
      data: {
        token,
        resetPasswordToken: createResetPasswordToken(user.username),
        voeux_email,
        user,
      },
    };
  },
};
