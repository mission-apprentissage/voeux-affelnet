const { connectToMongoForTests } = require("./testUtils");
const { createFakeMailer } = require("./fakeMailer");
const emails = require("../../../src/common/emails");

async function testContext() {
  const emailsSents = [];
  await connectToMongoForTests();

  return {
    components: {
      emails: emails(createFakeMailer({ calls: emailsSents })),
    },
    helpers: {
      getEmailsSent: () => emailsSents,
    },
  };
}

module.exports = testContext;
