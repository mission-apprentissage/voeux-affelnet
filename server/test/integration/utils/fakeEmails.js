const { createFakeMailer } = require("./fakeMailer");
const sender = require("../../../src/common/sender");

module.exports = {
  createFakeEmails() {
    const emailsSents = [];
    const mailer = createFakeMailer({ calls: emailsSents });
    return {
      sender: sender(mailer),
      getEmailsSent: () => emailsSents,
    };
  },
};
