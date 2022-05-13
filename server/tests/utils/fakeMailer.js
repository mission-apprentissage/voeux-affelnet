const uuid = require("uuid");
const { createMailer } = require("../../src/common/mailer");

function stubbedTransporter(options = {}) {
  const calls = options.calls || [];

  return {
    sendMail: (...args) => {
      if (options.fail) {
        throw new Error("Unable to send email");
      }

      calls.push(args[0]);
      return Promise.resolve({ messageId: uuid.v4() });
    },
  };
}

module.exports = {
  createFakeMailer: (options) => {
    const transporter = stubbedTransporter(options);
    return createMailer(transporter);
  },
};
