const { User } = require("../model");
const templates = require("../emails/templates");
const { generateHtml } = require("../utils/emailsUtils");

async function renderEmail(token) {
  const user = await User.findOne({ "emails.token": token }).lean();
  const { templateName } = user.emails.find((e) => e.token === token);
  const template = templates[templateName](user, token);

  return generateHtml(user.email, template);
}

module.exports = { renderEmail };
