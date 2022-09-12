const { Voeu } = require("../model/index.js");
const { compose, transformData } = require("oleoduc");
const { findDossiers } = require("./findDossiers.js");
const { capitalizeFirstLetter } = require("../utils/stringUtils.js");
const { uniq } = require("lodash");

function getJeuneStatut(statuts) {
  const array = uniq(statuts);
  if (array.includes(true)) {
    return "Oui";
  } else if (array.includes(false)) {
    return "Non";
  }
  return "ND";
}

async function streamSyntheseApprenants(options = {}) {
  const academies = options.academies;

  return compose(
    Voeu.aggregate([
      { $match: academies ? { "academie.code": { $in: academies } } : {} },
      {
        $group: {
          _id: "$apprenant.ine",
          apprenant: { $first: "$apprenant" },
          responsable: { $first: "$responsable" },
          adresse: { $first: "$_meta.adresse" },
          jeune_statuts: {
            $addToSet: "$_meta.jeune_uniquement_en_apprentissage",
          },
        },
      },
      {
        $sort: { "apprenant.nom": 1, "apprenant.prenom": 1 },
      },
    ]).cursor(),
    transformData(
      async ({ apprenant, responsable, adresse, jeune_statuts }) => {
        const dossiers = await findDossiers(apprenant, responsable);
        const statuts = dossiers.map((d) => d.statut);
        const statut =
          statuts.find((s) => s === "apprenti") || statuts.find((s) => s === "inscrit") || statuts[0] || "Non trouvé";

        return {
          "Apprenant INE": apprenant.ine,
          "Apprenant Nom": apprenant.nom,
          "Apprenant prénom": apprenant.prenom,
          "Apprenant Téléphone Personnel": apprenant.telephone_personnel,
          "Apprenant Téléphone Portable": apprenant.telephone_portable,
          "Apprenant Adresse": adresse,
          "Apprenant Adresse Code Postal": apprenant.adresse.code_postal,
          "Apprenant Adresse Ville": apprenant.adresse.ville,
          "Apprenant Adresse Pays": apprenant.adresse.pays,
          "Statut dans le tableau de bord": capitalizeFirstLetter(statut),
          "Jeunes uniquement en apprentissage": getJeuneStatut(jeune_statuts),
        };
      },
      { parallel: 10 }
    )
  );
}
module.exports = { streamSyntheseApprenants };
