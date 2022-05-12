// eslint-disable-next-line node/no-unpublished-require
let { MongoMemoryServer } = require("mongodb-memory-server");
const { connectToMongo } = require("../../src/common/mongodb");
const mongoose = require("mongoose");

let mongodHolder;

module.exports = {
  async startMongod() {
    mongodHolder = await MongoMemoryServer.create({
      binary: {
        version: "5.0.2",
      },
    });
    let uri = mongodHolder.getUri();
    return connectToMongo(uri);
  },
  stopMongod() {
    return mongodHolder.stop();
  },
  async removeAll() {
    let collections = await mongoose.connection.db.collections();
    return Promise.all(collections.map((c) => c.deleteMany({})));
  },
};
