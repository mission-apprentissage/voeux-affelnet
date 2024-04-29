const { oleoduc, writeData } = require("oleoduc");

const { markVoeuxAsAvailable } = require("../common/actions/markVoeuxAsAvailable.js");
const { Responsable, Voeu, Relation } = require("../common/model");

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

const getFirstVoeuxDate = async ({ siret, uai }) => {
  const voeuxDate = (
    await Voeu.find({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
    })
  )
    .map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1])
    .sort((a, b) => new Date(a) - new Date(b))[0];

  return voeuxDate ? new Date(voeuxDate) : null;
};

const getLastVoeuxDate = async ({ siret, uai }) => {
  const voeuxDate = (
    await Voeu.find({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
    })
  )
    .map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1])
    .sort((a, b) => new Date(b) - new Date(a))[0];

  return voeuxDate ? new Date(voeuxDate) : null;
};

const getNombreVoeux = async ({ siret, uai }) => {
  return await Voeu.countDocuments({
    "etablissement_formateur.uai": uai,
    "etablissement_responsable.siret": siret,
  }).lean();
};

const getNombreVoeuxRestant = async ({ siret, uai }) => {
  const relation = Relation.findOne({
    "etablissement_responsable.siret": siret,
    "etablissement_formateur.uai": uai,
  });

  const lastDownloadDate = relation.voeux_telechargements?.[relation.voeux_telechargements.length - 1]?.date;

  return (
    (await Voeu.countDocuments({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
      ...(lastDownloadDate
        ? {
            $expr: {
              $lte: [new Date(lastDownloadDate), { $last: "$_meta.import_dates" }],
            },
          }
        : {}),
    }).lean()) ?? 0
  );
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

module.exports = {
  countVoeux,
  getNombreVoeux,
  getNombreVoeuxRestant,
  getVoeuxDate,
  getFirstVoeuxDate,
  getLastVoeuxDate,
};
