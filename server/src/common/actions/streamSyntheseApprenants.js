const { Voeu } = require("../model/index.js");
const { compose, transformData } = require("oleoduc");
const { findDossiers } = require("./findDossiers.js");
const { capitalizeFirstLetter } = require("../utils/stringUtils.js");
const { uniq } = require("lodash");
const { findRegionByName } = require("../regions.js");

function getJeuneStatut(statuts, academie) {
  const array = uniq(statuts);
  const academies = findRegionByName("Centre-Val de Loire").academies;

  if (array.includes(true)) {
    return "Oui";
  } else if (array.includes(false) || academies.find((a) => a.code === academie.code)) {
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
          academie: { $first: "$academie" },
          adresse: { $first: "$_meta.adresse" },
          filters: {
            $push: {
              uai_etablissement: "$etablissement_accueil.uai",
              formation_cfd: "$formation.code_formation_diplome",
            },
          },
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
      async ({ apprenant, responsable, academie, adresse, filters, jeune_statuts }) => {
        const dossiers = await findDossiers(apprenant, responsable, filters);
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
          "Jeunes uniquement en apprentissage": getJeuneStatut(jeune_statuts, academie),
        };
      },
      { parallel: 10 }
    )
  );
}
module.exports = { streamSyntheseApprenants };
