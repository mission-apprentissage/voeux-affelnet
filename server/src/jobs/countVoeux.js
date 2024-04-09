const { oleoduc, writeData } = require("oleoduc");

const { markVoeuxAsAvailable } = require("../common/actions/markVoeuxAsAvailable.js");
const { Responsable, Voeu } = require("../common/model/index.js");

const getVoeuxDate = async ({ siret, uai }) => {
  const voeuxDates = (
    await Voeu.find({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
    })
  ).map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1]);

  // TODO : Récupérer la plus grande date !
  return voeuxDates[voeuxDates.length - 1];
};

const getNombreVoeux = async ({ siret, uai }) => {
  return await Voeu.countDocuments({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
  }).lean();
};

const countVoeux = async () => {
  const request = await Responsable.find().cursor();

  await oleoduc(
    request,
    writeData(async (responsable) => {
      await Promise.all(
        responsable.etablissements_formateur.map(async (etablissement) => {
          const voeuxDate = await getVoeuxDate({ siret: responsable.siret, uai: etablissement.uai });

          return markVoeuxAsAvailable({ siret: responsable.siret, uai: etablissement.uai }, voeuxDate);
        })
      );
    })
  );
};

module.exports = { countVoeux, getNombreVoeux, getVoeuxDate };
