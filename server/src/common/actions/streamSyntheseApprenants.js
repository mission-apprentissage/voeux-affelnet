const { Voeu } = require("../model");
const { compose, transformData } = require("oleoduc");
const { findDossiers } = require("./findDossiers.js");
const { capitalizeFirstLetter } = require("../utils/stringUtils.js");
const { ouiNon } = require("../utils/csvUtils.js");

function getJeuneStatut(statuts) {
  const array = [...new Set(statuts)];
  return ouiNon(array.includes(true));
}

async function streamSyntheseApprenants(options = {}) {
  const academies = options.academies;

  return compose(
    Voeu.aggregate([
      { $match: academies ? { "etablissement_origine.academie.code": { $in: academies.map((a) => a.code) } } : {} },
      {
        $group: {
          _id: "$apprenant.ine",
          apprenant: { $first: "$apprenant" },
          responsable: { $first: "$responsable" },
          adresse: { $first: "$apprenant.adresse.libelle" },
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
      async ({ apprenant, responsable, adresse, filters, jeune_statuts }) => {
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
          "Jeunes uniquement en apprentissage": getJeuneStatut(jeune_statuts),
        };
      },
      { parallel: 10 }
    )
  );
}
module.exports = { streamSyntheseApprenants };
