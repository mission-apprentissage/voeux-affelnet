const { findDossiers } = require("./findDossiers.js");

async function findDossier(voeu) {
  const uais = [voeu.etablissement_accueil.uai];
  const cfds = [voeu.formation.code_formation_diplome];

  const results = await findDossiers(voeu.apprenant, voeu.responsable, uais, cfds);

  return results[0] || null;
}

module.exports = { findDossier };
