const createEmails = require("./common/emails");
const createMailer = require("./common/mailer");

module.exports = async (options = {}) => {
  let mailer = options.mailer || createMailer();

  return {
    emails: options.emails || createEmails(mailer),
  };
};
