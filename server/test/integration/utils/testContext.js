const { connectToMongoForTests } = require("./testUtils");
const { createFakeMailer } = require("./fakeMailer");
const sender = require("../../../src/common/sender");

async function testContext() {
  const emailsSents = [];
  await connectToMongoForTests();

  return {
    components: {
      sender: sender(createFakeMailer({ calls: emailsSents })),
    },
    helpers: {
      getEmailsSent: () => emailsSents,
    },
  };
}

module.exports = testContext;
