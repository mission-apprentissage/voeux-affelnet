const nodemailer = require("nodemailer");
const { omit } = require("lodash");
const htmlToText = require("nodemailer-html-to-text").htmlToText;
const mjml = require("mjml");
const { promisify } = require("util");
const ejs = require("ejs");
const config = require("../config");
const renderFile = promisify(ejs.renderFile);

const createTransporter = (smtp) => {
  let needsAuthentication = !!smtp.auth.user;

  let transporter = nodemailer.createTransport(needsAuthentication ? smtp : omit(smtp, ["auth"]));
  transporter.use("compile", htmlToText({ ignoreImage: true }));
  return transporter;
};

module.exports = (transporter = createTransporter(config.smtp)) => {
  let utils = { getPublicUrl: (path) => `${config.publicUrl}${path}` };

  async function renderEmail(to, subject, template, data) {
    let buffer = await renderFile(template, {
      to,
      subject,
      data,
      utils,
    });
    let { html } = mjml(buffer.toString(), { minify: true });
    return html;
  }

  async function sendEmailViaSMTP(to, subject, template, data, options = {}) {
    let address = options.from || "voeux-affelnet@apprentissage.beta.gouv.fr";

    return transporter.sendMail({
      from: address,
      replyTo: options.replyTo || address,
      to: process.env.VOEUX_AFFELNET_SMTP_TO || to,
      ...(process.env.VOEUX_AFFELNET_SMTP_BCC ? { bcc: process.env.VOEUX_AFFELNET_SMTP_BCC } : {}),
      subject: subject,
      html: await renderEmail(to, subject, template, data),
      list: {
        help: "https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/accompagner-les-futurs-apprentis",
        unsubscribe: utils.getPublicUrl(`/api/emails/${data.token}/unsubscribe`),
      },
    });
  }

  return {
    renderEmail,
    sendEmailViaSMTP,
  };
};
