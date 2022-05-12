const { connectToMongoForTests } = require("./testUtils");
const { createFakeSender } = require("./fakeSender");

async function testContext() {
  await connectToMongoForTests();
  const emailsSents = [];

  return {
    components: {
      sender: createFakeSender({ calls: emailsSents }),
    },
    helpers: {
      getEmailsSent: () => emailsSents,
    },
  };
}

module.exports = testContext;
