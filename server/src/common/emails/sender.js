const uuid = require("uuid");
const { User } = require("../model");
const config = require("../../config");
const mjml = require("mjml");
const { promisify } = require("util");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
const { omit } = require("lodash");
const { htmlToText } = require("nodemailer-html-to-text");
const renderFile = promisify(ejs.renderFile);
const templates = require("./templates");

const createTransporter = (smtp) => {
  const needsAuthentication = !!smtp.auth.user;

  const transporter = nodemailer.createTransport(needsAuthentication ? smtp : omit(smtp, ["auth"]));
  transporter.use("compile", htmlToText({ ignoreImage: true }));
  return transporter;
};

function createMailer(transporter) {
  const utils = { getPublicUrl: (path) => `${config.publicUrl}${path}` };

  async function generateHtml(to, { subject, templateFile, data }) {
    const buffer = await renderFile(templateFile, {
      to,
      subject,
      data,
      utils,
    });
    const { html } = mjml(buffer.toString(), { minify: true });
    return html;
  }

  async function sendEmail(to, { from, subject, templateFile, data, replyTo }) {
    const address = from || "voeux-affelnet@apprentissage.beta.gouv.fr";

    const { messageId } = transporter.sendMail({
      from: address,
      replyTo: replyTo || address,
      to: process.env.VOEUX_AFFELNET_SMTP_TO || to,
      ...(process.env.VOEUX_AFFELNET_SMTP_BCC ? { bcc: process.env.VOEUX_AFFELNET_SMTP_BCC } : {}),
      subject: subject,
      html: await generateHtml(to, { subject, templateFile, data }),
      list: {
        help: "https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/accompagner-les-futurs-apprentis",
        unsubscribe: utils.getPublicUrl(`/api/emails/${data.token}/unsubscribe`),
      },
    });

    return messageId;
  }

  return {
    generateHtml,
    sendEmail,
  };
}

module.exports = (options = {}) => {
  const mailer = createMailer(options.transporter || createTransporter(config.smtp));

  function addEmail(token, user, templateName) {
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

  function addSendDate(token, user, templateName) {
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

  return {
    async exists(token) {
      const count = await User.countDocuments({ "emails.token": token });
      return count > 0;
    },
    async render(token) {
      const user = await User.findOne({ "emails.token": token }).lean();
      const { templateName } = user.emails.find((e) => e.token === token);
      const template = templates[templateName](user, token);

      return mailer.generateHtml(user.email, template);
    },
    async send(user, templateName) {
      const token = uuid.v4();
      const template = templates[templateName](user, token);

      try {
        await addEmail(token, user, templateName);
        const messageId = await mailer.sendEmail(user.email, template);
        await addMessageId(token, messageId);
      } catch (e) {
        await addEmailError(token, e);
      }

      return token;
    },
    async resend(token, options = {}) {
      const user = await User.findOne({ "emails.token": token }).lean();
      const previous = user.emails.find((e) => e.token === token);

      const nextTemplateName = options.newTemplateName || previous.templateName;
      const template = templates[nextTemplateName](user, token, { resend: !options.retry });

      try {
        await addSendDate(token, user, nextTemplateName);
        const messageId = await mailer.sendEmail(user.email, template);
        await addMessageId(token, messageId);
      } catch (e) {
        await addEmailError(token, e);
      }

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
