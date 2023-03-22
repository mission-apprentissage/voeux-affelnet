const server = require("../../src/http/server");
// eslint-disable-next-line node/no-unpublished-require
const axiosist = require("axiosist");
const { createFakeMailer } = require("./fakeMailer");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { User } = require("../../src/common/model");
const { insertGestionnaire, insertUser, insertCsaio } = require("./fakeData");
const { activateUser } = require("../../src/common/actions/activateUser");
const { Readable } = require("stream");
const { delay } = require("../../src/common/utils/asyncUtils");
const assert = require("assert");

async function waitUntil(callback, options = {}) {
  const { times = 10, timeout = 100 } = options;

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
  const stream = new Readable({
    objectMode: true,
    read() {},
  });

  stream.push(content);
  stream.push(null);

  return stream;
}

function createTestContext() {
  const emailsSents = [];
  const mailer = createFakeMailer({ calls: emailsSents });

  return {
    ...createEmailActions({ mailer }),
    getEmailsSent: () => emailsSents,
  };
}

async function startServer(options) {
  const testContext = createTestContext(options);
  const app = await server(testContext);
  const httpClient = axiosist(app);

  async function createAndLogUser(username, password, options = {}) {
    const { model, ...rest } = options;
    const Model = model || User;
    const insertMapper = {
      Gestionnaire: insertGestionnaire,
      Csaio: insertCsaio,
      User: insertUser,
    };

    await insertMapper[Model.modelName]({
      username,
      email: `${username}@apprentissage.beta.gouv.fr`,
      ...(rest || {}),
    });

    await activateUser(username, password);

    const auth = await logUser(username, password);
    const user = await Model.findOne({ username });
    return { auth, user };
  }

  async function logUser(username, password) {
    const response = await httpClient.post("/api/login", {
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
    ...testContext,
  };
}

module.exports = {
  startServer,
  createTestContext,
  createStream,
  waitUntil,
};
