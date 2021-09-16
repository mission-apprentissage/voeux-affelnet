const logger = require("../common/logger");
const { User } = require("../common/model");

async function createUser(username, email, options = {}) {
  logger.info(`Creating user ${username}...`);

  await User.create({
    username,
    email,
    isAdmin: options.admin || false,
    statut: "confirmé",
  });
}
module.exports = createUser;
