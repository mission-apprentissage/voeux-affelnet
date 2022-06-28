const { Dossier } = require("../model/index.js");
const { removeDiacritics } = require("../utils/objectUtils.js");

function findDossiers(apprenant, responsable = null) {
  return Dossier.find({
    annee_formation: 1,
    $or: [
      { ine_apprenant: apprenant.ine },
      {
        "_meta.nom_complet": removeDiacritics(`${apprenant.prenom} ${apprenant.nom}`),
      },
      ...(responsable?.email_1 ? [{ email_contact: responsable.email_1 }] : []),
      ...(responsable?.email_2 ? [{ email_contact: responsable.email_2 }] : []),
    ],
  });
}

module.exports = { findDossiers };
