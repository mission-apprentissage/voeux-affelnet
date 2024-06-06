const { Voeu, Relation } = require("../model");

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
  const relation = await Relation.findOne({
    "etablissement_responsable.siret": siret,
    "etablissement_formateur.uai": uai,
  });

  const lastDownloadDate = relation.voeux_telechargements?.[relation.voeux_telechargements.length - 1]?.date;

  // console.log("lastDownloadDate", lastDownloadDate);

  return (
    (await Voeu.countDocuments({
      "etablissement_responsable.siret": siret,
      "etablissement_formateur.uai": uai,
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

module.exports = {
  getNombreVoeux,
  getNombreVoeuxRestant,
  getVoeuxDate,
  getFirstVoeuxDate,
  getLastVoeuxDate,
};
