const logger = require("../common/logger");
const { User } = require("../common/model");

async function createAdmin(username, email) {
  logger.info(`Création de l'admin ${username}...`);

  await User.create({
    username,
    email,
    isAdmin: true,
    statut: "confirmé",
  });
}
module.exports = { createAdmin };
