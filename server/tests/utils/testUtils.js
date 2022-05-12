const server = require("../../src/http/server");
// eslint-disable-next-line node/no-unpublished-require
const axiosist = require("axiosist");
const { createFakeSender } = require("./fakeSender");
const { User, Cfa } = require("../../src/common/model");
const { insertCfa, insertUser } = require("./fakeData");
const { activateUser } = require("../../src/common/actions/activateUser");
const { Readable } = require("stream");
const { delay } = require("../../src/common/utils/asyncUtils");
const assert = require("assert"); // eslint-disable-line node/no-unpublished-require

async function waitUntil(callback, options = {}) {
  let { times = 10, timeout = 100 } = options;

  let cpt = 0;
  let res;
  while (!res && cpt++ < times) {
    await delay(timeout);
    res = await callback();
  }

  if (!res) {
    assert.fail(`waintUntil timeout ${callback.toString()}`);
  }
  return res;
}

function createStream(content) {
  let stream = new Readable({
    objectMode: true,
    read() {},
  });

  stream.push(content);
  stream.push(null);

  return stream;
}

function createTestContext() {
  const emailsSents = [];

  return {
    sender: createFakeSender({ calls: emailsSents }),
    getEmailsSent: () => emailsSents,
  };
}

async function startServer(options) {
  let context = createTestContext(options);
  const app = await server({ sender: context.sender });
  const httpClient = axiosist(app);

  async function createAndLogUser(username, password, options = {}) {
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
  }

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
    createAndLogUser,
    logUser,
    ...context,
  };
}

module.exports = {
  startServer,
  createTestContext,
  createStream,
  waitUntil,
};
