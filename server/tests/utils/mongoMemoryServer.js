// eslint-disable-next-line node/no-unpublished-require
const { MongoMemoryServer } = require("mongodb-memory-server");
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
    const uri = mongodHolder.getUri();
    return connectToMongo(uri);
  },
  stopMongod() {
    return mongodHolder.stop();
  },
  async removeAll() {
    const collections = await mongoose.connection.db.collections();
    return Promise.all(collections.map((c) => c.deleteMany({})));
  },
};
