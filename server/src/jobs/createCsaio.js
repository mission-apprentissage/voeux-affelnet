const logger = require("../common/logger");
const { Csaio } = require("../common/model/index.js");
const { some } = require("lodash");
const { findAcademieByCode } = require("../common/academies.js");

async function createCsaio(username, email, academies) {
  if (some(academies, (a) => findAcademieByCode(a.code) === null)) {
    throw new Error(`Académies invalides`);
  }

  logger.info(`Création de l'utilisateur ${username} (CSAIO, academies ${academies.map((a) => a.nom).join(",")})...`);
  await Csaio.create({
    username,
    email,
    academies,
    statut: "confirmé",
  });
}
module.exports = { createCsaio };
