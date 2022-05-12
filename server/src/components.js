const sender = require("./common/sender");
const createMailer = require("./common/mailer");

module.exports = async (options = {}) => {
  let mailer = options.mailer || createMailer();

  return {
    sender: options.sender || sender(mailer),
  };
};
