const { oleoduc, writeData } = require("oleoduc");
const fsExtra = require("fs-extra");
const Models = require("../../common/model");
const config = require("../../config");

async function clear(users) {
  await fsExtra.emptyDir(config.outputDir);
  await oleoduc(
    Models.User.find().cursor(),
    writeData((user) => users.removeUser(user.username))
  );

  return Object.keys(Models).reduce(async (acc, key) => {
    let obj = await acc;
    return {
      ...obj,
      [key]: await Models[key].deleteMany({}),
    };
  }, Promise.resolve({}));
}

module.exports = clear;
