const uuid = require("uuid");
const { User } = require("../model");
const templates = require("../emails/templates");
const { createMailer } = require("../mailer");
const { addEmail } = require("./addEmail");
const { addEmailMessageId } = require("./addEmailMessageId");
const { addEmailError } = require("./addEmailError");
const { addEmailSendDate } = require("./addEmailSendDate");
const logger = require("../logger");

//Ces actions sont construites à la volée car il est nécessaire de pouvoir injecter un mailer durant les tests
module.exports = (options = {}) => {
  const mailer = options.mailer || createMailer();

  return {
    async sendEmail(user, templateName, variables = {}) {
      const token = uuid.v4();
      const template = templates[templateName](user, token, variables);

      try {
        await addEmail(user, token, templateName, variables);
        const messageId = await mailer.sendEmailMessage(user.email, template, variables);
        await addEmailMessageId(token, messageId);
      } catch (e) {
        logger.error(e);
        await addEmailError(token, e);
      }

      return token;
    },

    async resendEmail(token, variables, options = {}) {
      const user = options.user ?? (await User.findOne({ "emails.token": token }).lean());
      const previous = user.emails.find((e) => e.token === token);

      const nextTemplateName = options.newTemplateName || previous.templateName;
      const template = templates[nextTemplateName](user, token, variables, { resend: !options.retry });

      try {
        await addEmailSendDate(token, nextTemplateName);
        const messageId = await mailer.sendEmailMessage(user.email, template, variables);
        await addEmailMessageId(token, messageId);
      } catch (e) {
        logger.error(e);
        await addEmailError(token, e);
      }

      return token;
    },
  };
};
