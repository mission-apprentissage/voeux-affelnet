const logger = require("../common/logger");
const { findAcademieByUai } = require("../common/academies");
const { Cfa, Voeu } = require("../common/model");

async function createCfa(username, email, options = {}) {
  logger.info(`Creating cfa ${username}...`);

  let found = await Voeu.findOne({ "etablissement_accueil.uai": username });
  let academie = findAcademieByUai(username);

  await Cfa.create({
    type: "Cfa",
    username,
    email,
    uai: username,
    emails: [],
    statut: "en attente",
    siret: options.siret,
    raison_sociale: options.raison_sociale,
    isAdmin: false,
    unsubscribe: false,
    writeable: false,
    email_source: "directeur",
    academie: {
      code: academie.code,
      nom: academie.nom,
    },
    ...(found ? { voeux_date: found._meta.import_dates[found._meta.import_dates.length - 1] } : {}),
    voeux_telechargements: [],
  });
}
module.exports = createCfa;
