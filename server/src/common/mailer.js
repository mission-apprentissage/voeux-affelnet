const nodemailer = require("nodemailer");
const { omit } = require("lodash");
const { htmlToText } = require("nodemailer-html-to-text");
const config = require("../config");
const { /*getPublicUrl,*/ generateHtml } = require("./utils/emailsUtils");

function createTransporter(smtp) {
  const needsAuthentication = !!smtp.auth.user;
  const transporter = nodemailer.createTransport(needsAuthentication ? smtp : omit(smtp, ["auth"]));
  transporter.use("compile", htmlToText({ ignoreImage: true }));
  return transporter;
}

function createMailer(transporter = createTransporter(config.smtp)) {
  async function sendEmailMessage(to, template) {
    const { from, subject, replyTo } = template;
    const address = from || "voeux-affelnet@apprentissage.beta.gouv.fr";

    const { messageId } = await transporter.sendMail({
      from: address,
      replyTo: replyTo || address,
      to: process.env.VOEUX_AFFELNET_SMTP_TO || to,
      ...(process.env.VOEUX_AFFELNET_SMTP_BCC ? { bcc: process.env.VOEUX_AFFELNET_SMTP_BCC } : {}),
      subject: subject,
      html: await generateHtml(to, template),
      list: {
        // help: "https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/accompagner-les-futurs-apprentis",
        help: "https://candidats-affelnet.apprentissage.education.fr/support",
        // unsubscribe: getPublicUrl(`/api/emails/${data.token}/unsubscribe`),
      },
    });

    return messageId;
  }

  return {
    sendEmailMessage,
  };
}

module.exports = { createMailer };
