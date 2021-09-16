const mailer = require("../../../src/common/mailer");
const uuid = require("uuid");

module.exports = (options = {}) => {
  let calls = options.calls || [];
  let registerCall = (parameters) => {
    if (options.fail) {
      let err = new Error("Unable to send email");
      return Promise.reject(err);
    } else {
      calls.push(parameters[0]);
      return Promise.resolve({ messageId: uuid.v4() });
    }
  };

  return mailer({
    sendMail: (...args) => {
      return registerCall(args);
    },
  });
};
