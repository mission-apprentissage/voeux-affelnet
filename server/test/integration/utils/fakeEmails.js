const { createFakeMailer } = require("./fakeMailer");
const emails = require("../../../src/common/emails");

module.exports = {
  createFakeEmails() {
    const emailsSents = [];
    const mailer = createFakeMailer({ calls: emailsSents });
    return {
      emails: emails(mailer),
      getEmailsSent: () => emailsSents,
    };
  },
};
