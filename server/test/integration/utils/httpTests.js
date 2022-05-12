const axiosist = require("axiosist"); // eslint-disable-line node/no-unpublished-require
const { cleanAll } = require("./testUtils.js");
const testContext = require("./testContext.js");
const { insertUser, insertCfa } = require("./fakeData.js");
const server = require("../../../src/http/server");
const { User, Cfa } = require("../../../src/common/model");
const { activateUser } = require("../../../src/common/actions/activateUser");

let startServer = async (options = {}) => {
  let { components, helpers } = await testContext(options);

  let app = await server(components);
  let httpClient = axiosist(app);

  async function logUser(username, password) {
    let response = await httpClient.post("/api/login", {
      username,
      password,
    });

    return {
      Authorization: "Bearer " + response.data.token,
    };
  }

  return {
    httpClient,
    components,
    createAndLogUser: async (username, password, options = {}) => {
      let { model, ...rest } = options;
      let Model = model || User;
      let insert = Model === Cfa ? insertCfa : insertUser;
      await insert({
        username,
        email: `${username}@apprentissage.beta.gouv.fr`,
        ...(rest || {}),
      });
      await activateUser(username, password);

      let auth = await logUser(username, password);
      let user = await Model.findOne({ username });
      return { auth, user };
    },
    logUser,
    ...helpers,
  };
};

module.exports = (desc, cb) => {
  describe(desc, function () {
    cb({ startServer });
    afterEach(cleanAll);
  });
};
