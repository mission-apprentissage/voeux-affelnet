const config = require("../../config");
const mjml = require("mjml");
const { promisify } = require("util");
const ejs = require("ejs");
const renderFile = promisify(ejs.renderFile);

function getPublicUrl(path) {
  return `${config.publicUrl}${path}`;
}

async function generateHtml(to, template) {
  const { subject, templateFile, data } = template;
  const buffer = await renderFile(templateFile, {
    to,
    subject,
    data,
    utils: { getPublicUrl },
  });
  const { html } = mjml(buffer.toString(), { minify: true });
  return html;
}

module.exports = {
  getPublicUrl,
  generateHtml,
};
