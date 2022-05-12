const sender = require("./common/emails/sender");

module.exports = async (options = {}) => {
  return {
    sender: options.sender || sender(options.transporter),
  };
};
