const sender = require("../../src/common/emails/sender");
const uuid = require("uuid");

function createFakeSender(options = {}) {
  const calls = options.calls || [];

  const transporter = {
    sendMail: (...args) => {
      if (options.fail) {
        throw new Error("Unable to send email");
      }

      calls.push(args[0]);
      return Promise.resolve({ messageId: uuid.v4() });
    },
  };

  return sender({ transporter });
}

module.exports = { createFakeSender };
