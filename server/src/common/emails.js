const path = require("path");
const uuid = require("uuid");
const { User } = require("./model");
const { createResetPasswordToken, createActionToken } = require("./utils/jwtUtils");

function getTemplate(name) {
  return path.join(__dirname, "emails", `${name}.mjml.ejs`);
}

const templates = {
  confirmation: (cfa, token, options = {}) => {
    let prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : ${cfa.siret})`,
      template: getTemplate("confirmation"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
      },
    };
  },
  confirmation_voeux: (cfa, token, options = {}) => {
    let prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : ${cfa.siret})`,
      template: getTemplate("confirmation_voeux"),
      data: {
        cfa,
        token,
        actionToken: createActionToken(cfa.username),
      },
    };
  },
  activation: (user, token, options = {}) => {
    let prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Activation de votre compte`,
      template: getTemplate("activation"),
      data: {
        user,
        token,
        actionToken: createActionToken(user.username),
      },
    };
  },
  activation_cfa: (user, token, options = {}) => {
    let prefix = options.resend ? "[Rappel] " : "";
    return {
      subject: `${prefix}Des voeux Affelnet sont téléchargeables`,
      template: getTemplate("activation_cfa"),
      data: {
        user,
        token,
        actionToken: createActionToken(user.username),
      },
    };
  },
  notification: (cfa, token) => {
    return {
      subject: `Mise à jour des voeux exprimés en apprentissage sur Affelnet pour l'établissement ${cfa.siret}`,
      template: getTemplate("notification"),
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
      template: getTemplate("reset_password"),
      data: {
        user,
        token,
        resetPasswordToken: createResetPasswordToken(user.username),
      },
    };
  },
};

module.exports = (mailer) => {
  async function sendEmail(user, token, { from, subject, template, data, replyTo }) {
    try {
      let { messageId } = await mailer.sendEmail(user.email, subject, template, data, { from, replyTo });
      await User.updateOne(
        { "emails.token": token },
        {
          $addToSet: {
            "emails.$.messageIds": messageId,
          },
          $unset: {
            "emails.$.error": 1,
          },
        },
        { runValidators: true }
      );
    } catch (e) {
      await User.updateOne(
        { "emails.token": token },
        {
          $set: {
            "emails.$.error": {
              type: "fatal",
              message: e.message,
            },
          },
        },
        { runValidators: true }
      );
      throw e;
    }
  }

  return {
    async getTemplateName(token) {
      let found = await User.findOne({ "emails.token": token });
      if (!found) {
        return null;
      }

      let { templateName } = found.emails.find((e) => e.token === token);
      return templateName;
    },
    async exists(token) {
      let count = await User.countDocuments({ "emails.token": token });
      return count > 0;
    },
    async render(token) {
      let user = await User.findOne({ "emails.token": token }).lean();
      let { templateName } = user.emails.find((e) => e.token === token);
      let template = templates[templateName](user, token);

      return mailer.renderEmail(user.email, template.subject, template.template, template.data);
    },
    async send(user, templateName) {
      let token = uuid.v4();
      let template = templates[templateName](user, token);

      await User.updateOne(
        { username: user.username },
        {
          $push: {
            emails: {
              token,
              templateName,
              sendDates: [new Date()],
            },
          },
        },
        { runValidators: true }
      );

      await sendEmail(user, token, template);

      return token;
    },
    async resend(token, options = {}) {
      let user = await User.findOne({ "emails.token": token }).lean();
      let previous = user.emails.find((e) => e.token === token);

      let nextTemplateName = options.newTemplateName || previous.templateName;
      let template = templates[nextTemplateName](user, token, { resend: !options.retry });

      await User.updateOne(
        { "emails.token": token },
        {
          $set: {
            "emails.$.templateName": nextTemplateName,
          },
          $push: {
            "emails.$.sendDates": new Date(),
          },
        },
        { runValidators: true }
      );

      await sendEmail(user, token, template);

      return token;
    },
    async markAsOpened(token) {
      await User.updateOne(
        { "emails.token": token },
        {
          $set: {
            "emails.$.openDate": new Date(),
          },
        },
        { runValidators: true }
      );
    },
    async markAsFailed(messageId, type) {
      await User.updateOne(
        { "emails.messageIds": messageId },
        {
          $set: {
            "emails.$.error": {
              type,
            },
          },
        },
        { runValidators: true }
      );
    },
    async markAsDelivered(messageId) {
      await User.updateOne(
        { "emails.messageIds": messageId },
        {
          $unset: {
            "emails.$.error": 1,
          },
        },
        { runValidators: true }
      );
    },
  };
};
