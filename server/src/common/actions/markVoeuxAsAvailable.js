const { Responsable, Formateur, Voeu } = require("../model");
const logger = require("../logger.js");

async function markVoeuxAsAvailable({ siret, uai }, voeuxDate) {
  const nombre_voeux = await Voeu.countDocuments({
    "etablissement_responsable.siret": siret,
    "etablissement_formateur.uai": uai,
  });

  logger.info(`${siret} / ${uai} : ${nombre_voeux.toLocaleString()} voeux`);

  const { matchedCount: matchedResponsableCount } = await Responsable.updateOne(
    { siret, "etablissements_formateur.uai": uai },
    {
      $set: {
        "etablissements_formateur.$.voeux_date": voeuxDate,
        "etablissements_formateur.$.nombre_voeux": nombre_voeux,
      },

      // $unset: { "etablissements_formateur.$[].voeux_date": "" },
    },
    { runValidators: true }
  );

  const { matchedCount: matchedFormateurCount } = await Formateur.updateOne(
    { uai, "etablissements_responsable.siret": siret },
    {
      $set: {
        "etablissements_responsable.$.voeux_date": voeuxDate,
        "etablissements_responsable.$.nombre_voeux": nombre_voeux,
      },

      // $unset: { "etablissements_responsable.$[].voeux_date": "" },
    },
    { runValidators: true }
  );

  if (matchedResponsableCount === 0) {
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
