const { findAcademieByCode } = require("../common/academies");
const logger = require("../common/logger");
const { User } = require("../common/model");

async function createAdmin(username, email, codeAcademie) {
  logger.info(`Création de l'admin ${username}...`);

  let academie = codeAcademie ? findAcademieByCode(codeAcademie) : undefined;

  await User.create({
    username,
    email,
    isAdmin: true,
    statut: "confirmé",
    academie,
  });
}
module.exports = { createAdmin };
