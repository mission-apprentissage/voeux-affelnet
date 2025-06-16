const { Voeu, Relation } = require("../model");

// const getVoeuxDate = async ({ siret_responsable, siret_formateur }) => {
//   const voeuxDates = (
//     await Voeu.find({
//       "etablissement_formateur.siret": siret_formateur,
//       "etablissement_responsable.siret": siret_responsable,
//     })
//   ).map((voeu) => voeu._meta.import_dates[voeu._meta.import_dates.length - 1]);

//   return voeuxDates.sort((a, b) => new Date(a) - new Date(b))[voeuxDates.length - 1];
// };

const getFirstVoeuxDate = async ({ siret_responsable, siret_formateur }) => {
  const voeuxDate = [
    ...new Set(
      (
        await Voeu.find({
          "etablissement_formateur.siret": siret_formateur,
          "etablissement_responsable.siret": siret_responsable,
        })
      )
        .flatMap((voeu) => voeu._meta.import_dates)
        .map((date) => new Date(date).toISOString())
    ),
  ].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  // console.log("getFirstVoeuxDate", siret_responsable, siret_formateur, voeuxDate);
  return voeuxDate ? new Date(voeuxDate) : null;
};

const getLastVoeuxDate = async ({ siret_responsable, siret_formateur }) => {
  const voeuxDate = [
    ...new Set(
      (
        await Voeu.find({
          "etablissement_formateur.siret": siret_formateur,
          "etablissement_responsable.siret": siret_responsable,
        })
      )
        .flatMap((voeu) => voeu._meta.import_dates)
        .map((date) => new Date(date).toISOString())
    ),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  // console.log("getLastVoeuxDate", siret_responsable, siret_formateur, voeuxDate);
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
  // getVoeuxDate,
  getFirstVoeuxDate,
  getLastVoeuxDate,
};
