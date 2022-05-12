const assert = require("assert");
const { Readable } = require("stream");
const path = require("path");
const { emptyDir } = require("fs-extra");
const config = require("../../../src/config");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter"); // eslint-disable-line node/no-unpublished-require
const { connectToMongo } = require("../../../src/common/mongodb");
const { delay } = require("../../../src/common/utils/asyncUtils");

let testDataDir = path.join(__dirname, "../../.local/test");
let mongoHolder = null;

async function connectToMongoForTests() {
  if (!mongoHolder) {
    let uri = config.mongodb.uri.split("voeux_affelnet").join("voeux_affelnet_test");
    mongoHolder = await connectToMongo(uri);
  }
  return mongoHolder;
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

module.exports = {
  connectToMongoForTests,
  createStream,
  cleanAll() {
    let models = require("../../../src/common/model");
    return Promise.all([emptyDir(testDataDir), ...Object.values(models).map((m) => m.deleteMany({}))]);
  },
  randomize(value) {
    return `${value}-${Math.random().toString(36).substring(7)}`;
  },
  getMockedAxios(options = {}) {
    let instance = axios.create();
    if (options.debug) {
      instance.interceptors.request.use((request) => {
        console.log("Starting Request", JSON.stringify(request, null, 2));
        return request;
      });
    }
    return {
      mock: new MockAdapter(instance),
      axios: instance,
    };
  },
  async waitUntil(callback, options = {}) {
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
  },
};
