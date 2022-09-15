const { findDossiers } = require("./findDossiers.js");

async function findDossier(voeu) {
  const results = await findDossiers(voeu.apprenant, voeu.responsable, [
    {
      uai_etablissement: voeu.etablissement_accueil.uai,
      formation_cfd: voeu.formation.code_formation_diplome,
    },
  ]);

  return results[0] || null;
}

module.exports = { findDossier };
