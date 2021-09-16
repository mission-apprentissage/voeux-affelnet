const { connectToMongoForTests, getMockedAxios } = require("./testUtils.js");
const users = require("../../../src/common/users");
const cfas = require("../../../src/common/cfas");
const emails = require("../../../src/common/emails");
const fakeMailer = require("./fakeMailer");
const createComponents = require("../../../src/components");

async function testContext(options = {}) {
  let { mock, axios } = getMockedAxios();
  let emailsSents = [];
  let mailer = fakeMailer({ calls: emailsSents });
  let { db } = await connectToMongoForTests();

  return {
    helpers: {
      getEmailsSent: () => emailsSents,
      axios,
      apiMocker: mock,
    },
    components: await createComponents({
      db,
      users: await users(),
      cfas: await cfas(),
      emails: emails(mailer),
      ...options,
    }),
  };
}

module.exports = testContext;
