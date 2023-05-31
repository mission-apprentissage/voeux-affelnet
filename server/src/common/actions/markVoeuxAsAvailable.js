const { Gestionnaire, Formateur, Voeu } = require("../model/index.js");
const logger = require("../logger.js");

async function markVoeuxAsAvailable({ siret, uai }, voeuxDate) {
  const nombre_voeux = await Voeu.countDocuments({
    "etablissement_gestionnaire.siret": siret,
    "etablissement_formateur.uai": uai,
  });

  console.log(`${siret} / ${uai} : ${nombre_voeux} voeux`);

  const { matchedCount: matchedGestionnaireCount } = await Gestionnaire.updateOne(
    { siret, "etablissements.uai": uai },
    {
      $set: {
        "etablissements.$.voeux_date": voeuxDate,
        "etablissements.$.nombre_voeux": nombre_voeux,
      },

      // $unset: { "etablissements.$[].voeux_date": "" },
    },
    { runValidators: true }
  );

  const { matchedCount: matchedFormateurCount } = await Formateur.updateOne(
    { uai, "etablissements.siret": siret },
    {
      $set: {
        "etablissements.$.voeux_date": voeuxDate,
        "etablissements.$.nombre_voeux": nombre_voeux,
      },

      // $unset: { "etablissements.$[].voeux_date": "" },
    },
    { runValidators: true }
  );

  if (matchedGestionnaireCount === 0) {
    logger.warn(`L'établissement responsable n'est pas connu en base ${siret} (formateur: ${uai})`);
    return false;
  }

  if (matchedFormateurCount === 0) {
    logger.warn(`L'établissement formateur n'est pas connu en base ${uai} (responsable: ${siret})`);
    return false;
  }

  return true;
}

module.exports = { markVoeuxAsAvailable };
