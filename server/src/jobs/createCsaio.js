const logger = require("../common/logger");
const { findRegionByCode } = require("../common/regions.js");
const { pick } = require("lodash");
const { Csaio } = require("../common/model/index.js");

async function createCsaio(username, email, regionCode) {
  const region = findRegionByCode(regionCode);
  if (!region) {
    throw new Error(`Region invalide ${regionCode}`);
  }

  logger.info(`Création de l'utilisateur ${username} (CSAIO, region ${region.nom})...`);
  await Csaio.create({
    username,
    email,
    region: pick(region, ["code", "nom"]),
    statut: "confirmé",
  });
}
module.exports = { createCsaio };
