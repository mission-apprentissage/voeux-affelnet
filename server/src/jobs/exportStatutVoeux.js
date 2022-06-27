const { Cfa, Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV, transformData, filterData, flattenArray } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date } = require("../common/utils/csvUtils.js");

async function exportStatutVoeux(output, options = {}) {
  const columns = options.columns || {};
  await oleoduc(
    Cfa.aggregate([{ $match: options.filter || {} }, { $sort: { "academie.code": 1, siret: 1 } }]).cursor(),
    filterData((data) => !!data.etablissements?.length),
    transformData((cfa) => cfa.etablissements?.flatMap((etablissement) => ({ cfa, etablissement }))),
    flattenArray(),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        Académie: (data) => data.cfa?.academie?.nom,
        Siret: (data) => data.cfa?.siret,
        Uai: (data) => data.etablissement?.uai,
        Vœux: (data) => ouiNon(data.etablissement.voeux_date),
        "Date des derniers vœux disponibles": (data) => date(data.etablissement.voeux_date),
        Téléchargement: (data) => ouiNon(data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)),
        "Date du dernier téléchargement": (data) =>
          date(data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)?.date),
        "Voeux à télécharger": (data) =>
          ouiNon(
            data.etablissement.voeux_date &&
              !(
                data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)?.date >
                data.etablissement.voeux_date
              )
          ),
        "Nombre de vœux à télécharger": async (data) => {
          const downloadDate = data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)?.date;
          console.log(data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)?.date);
          return `${await Voeu.countDocuments({
            "etablissement_accueil.uai": data.etablissement.uai,
            ...(downloadDate
              ? {
                  "_meta.import_dates": {
                    $elemMatch: {
                      $exists: true,
                      $gte: new Date(downloadDate),
                    },
                  },
                }
              : {}),
          })}`;
        },
        "Nombre total de voeux": async (data) =>
          `${await Voeu.countDocuments({
            "etablissement_accueil.uai": data.etablissement.uai,
          })}`,
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { exportStatutVoeux };
