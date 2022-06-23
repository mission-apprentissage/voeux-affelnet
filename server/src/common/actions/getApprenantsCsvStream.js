const { Voeu } = require("../model/index.js");
const { compose, transformData, transformIntoCSV } = require("oleoduc");
const { findDossiers } = require("./findDossiers.js");

async function getApprenantsCsvStream(options = {}) {
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
        const statut = dossiers.map((d) => d.statut).find((d) => d.statut === "apprenti") || "autre";

        return {
          "Apprenant INE": apprenant.ine,
          "Apprenant Nom": apprenant.nom,
          "Apprenant prénom": apprenant.prenom,
          "Apprenant Téléphone Personnel": apprenant.telephone_personnel,
          "Apprenant Téléphone Portable": apprenant.telephone_portable,
          "Apprenant Adresse": adresse,
          "Statut dans le tableau de bord": statut,
        };
      },
      { parallel: 10 }
    ),
    transformIntoCSV()
  );
}
module.exports = { getApprenantsCsvStream };
