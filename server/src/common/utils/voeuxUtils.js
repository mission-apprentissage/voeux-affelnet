const { Voeu, Relation } = require("../model");

const getVoeuxDate = async ({ siret_responsable, siret_formateur }) => {
  const voeuxDates = (
    await Voeu.find({
      "etablissement_formateur.siret": siret_formateur,
      "etablissement_responsable.siret": siret_responsable,
    })
  ).map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1]);

  // TODO : Récupérer la plus grande date !
  return voeuxDates[voeuxDates.length - 1];
};

const getFirstVoeuxDate = async ({ siret_responsable, siret_formateur }) => {
  const voeuxDate = (
    await Voeu.find({
      "etablissement_formateur.siret": siret_formateur,
      "etablissement_responsable.siret": siret_responsable,
    })
  )
    .map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1])
    .sort((a, b) => new Date(a) - new Date(b))[0];

  return voeuxDate ? new Date(voeuxDate) : null;
};

const getLastVoeuxDate = async ({ siret_responsable, siret_formateur }) => {
  const voeuxDate = (
    await Voeu.find({
      "etablissement_formateur.siret": siret_formateur,
      "etablissement_responsable.siret": siret_responsable,
    })
  )
    .map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1])
    .sort((a, b) => new Date(b) - new Date(a))[0];

  return voeuxDate ? new Date(voeuxDate) : null;
};

const getNombreVoeux = async ({ siret_responsable, siret_formateur }) => {
  return await Voeu.countDocuments({
    "etablissement_formateur.siret": siret_formateur,
    "etablissement_responsable.siret": siret_responsable,
  }).lean();
};

const getNombreVoeuxRestant = async ({ siret_responsable, siret_formateur }) => {
  const relation = await Relation.findOne({
    "etablissement_formateur.siret": siret_formateur,
    "etablissement_responsable.siret": siret_responsable,
  });

  const lastDownloadDate = relation?.voeux_telechargements?.[relation?.voeux_telechargements.length - 1]?.date;

  // console.log("lastDownloadDate", lastDownloadDate);

  return (
    (await Voeu.countDocuments({
      "etablissement_formateur.siret": siret_formateur,
      "etablissement_responsable.siret": siret_responsable,
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
