const uuid = require("uuid");
const { User } = require("../model");
const templates = require("../emails/templates");
const { createMailer } = require("../mailer");

function addEmail(user, token, templateName) {
  return User.updateOne(
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
}

function addSendDate(token, templateName) {
  return User.updateOne(
    { "emails.token": token },
    {
      $set: {
        "emails.$.templateName": templateName,
      },
      $push: {
        "emails.$.sendDates": new Date(),
      },
    },
    { runValidators: true }
  );
}

function addEmailError(token, e) {
  return User.updateOne(
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
}

function addMessageId(token, messageId) {
  return User.updateOne(
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
}

module.exports = (options = {}) => {
  //Ces actions sont construites à la volée car il est nécessaire de pouvoir injecter un mailer durant les tests
  const mailer = options.mailer || createMailer();

  return {
    async sendEmail(user, templateName) {
      const token = uuid.v4();
      const template = templates[templateName](user, token);

      try {
        await addEmail(user, token, templateName);
        const messageId = await mailer.sendEmailMessage(user.email, template);
        await addMessageId(token, messageId);
      } catch (e) {
        await addEmailError(token, e);
      }

      return token;
    },
    async resendEmail(token, options = {}) {
      const user = await User.findOne({ "emails.token": token }).lean();
      const previous = user.emails.find((e) => e.token === token);

      const nextTemplateName = options.newTemplateName || previous.templateName;
      const template = templates[nextTemplateName](user, token, { resend: !options.retry });

      try {
        await addSendDate(token, nextTemplateName);
        const messageId = await mailer.sendEmailMessage(user.email, template);
        await addMessageId(token, messageId);
      } catch (e) {
        await addEmailError(token, e);
      }

      return token;
    },
  };
};
