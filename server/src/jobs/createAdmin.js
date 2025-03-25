const { USER_STATUS } = require("../common/constants/UserStatus");

const logger = require("../common/logger");
const { Admin } = require("../common/model");

async function createAdmin(username, email) {
  logger.info(`Création du compte admin ${username}...`);

  await Admin.create({
    username,
    email,
    statut: USER_STATUS.CONFIRME,
  });
}
module.exports = { createAdmin };
