const { Voeu } = require("../model/index.js");
const { compose, transformData } = require("oleoduc");
const { findDossiers } = require("./findDossiers.js");
const { capitalizeFirstLetter } = require("../utils/stringUtils.js");

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
        },
      },
    ]).cursor(),
    transformData(
      async ({ apprenant, responsable, adresse }) => {
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
        };
      },
      { parallel: 10 }
    )
  );
}
module.exports = { streamSyntheseApprenants };
