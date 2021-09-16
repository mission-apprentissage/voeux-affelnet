const { cleanAll } = require("./testUtils.js");
const testContext = require("./testContext.js");

module.exports = (desc, cb) => {
  describe(desc, function () {
    let context;

    beforeEach(async () => {
      context = await testContext();
    });

    cb({ getHelpers: () => context.helpers, getComponents: () => context.components });

    afterEach(cleanAll);
  });
};
