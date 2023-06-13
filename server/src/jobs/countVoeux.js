const { oleoduc, writeData } = require("oleoduc");

const { markVoeuxAsAvailable } = require("../common/actions/markVoeuxAsAvailable.js");
const { Gestionnaire, Voeu } = require("../common/model/index.js");

const getVoeuxDate = async ({ siret, uai }) => {
  return (
    await Voeu.find({
      "etablissement_formateur.uai": uai,
      "etablissement_gestionnaire.siret": siret,
    })
  )
    .map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1])
    .sort()[0];
};

const getNombreVoeux = async ({ siret, uai }) => {
  await Voeu.countDocuments({
    "etablissement_formateur.uai": uai,
    "etablissement_gestionnaire.siret": siret,
  }).lean();
};

const countVoeux = async () => {
  const request = await Gestionnaire.find().cursor();

  await oleoduc(
    request,
    writeData(async (gestionnaire) => {
      await Promise.all(
        gestionnaire.etablissements.map(async (etablissement) => {
          const voeuxDate = await getVoeuxDate({ siret: gestionnaire.siret, uai: etablissement.uai });

          return markVoeuxAsAvailable({ siret: gestionnaire.siret, uai: etablissement.uai }, voeuxDate);
        })
      );
    })
  );
};

module.exports = { countVoeux, getNombreVoeux, getVoeuxDate };
