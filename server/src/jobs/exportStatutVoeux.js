const { Cfa, Voeu } = require("../common/model");
const { oleoduc, transformIntoCSV, filterData } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date } = require("../common/utils/csvUtils.js");
const { sortDescending } = require("../common/utils/dateUtils.js");

const getLastDownloadDate = (data) => {
  const relatedDowloads = data.voeux_telechargements
    ?.filter((vt) => vt.uai === data.etablissements.uai)
    .sort((a, b) => sortDescending(a.date, b.date));

  return relatedDowloads[relatedDowloads.length - 1]?.date;
};

async function exportStatutVoeux(output, options = {}) {
  const columns = options.columns || {};
  await oleoduc(
    Cfa.aggregate([
      {
        $match: {
          ...(options.filter || {}),
          statut: { $ne: "non concerné" },
        },
      },
      { $unwind: "$etablissements" },
      { $sort: { "academie.code": 1, siret: 1 } },
    ]).cursor(),
    filterData((data) => {
      console.log(data);
      return data;
    }),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        Académie: (data) => data.academie?.nom,
        Siret: (data) => data.siret,
        Uai: (data) => data.etablissements?.uai,
        Vœux: (data) => ouiNon(data.etablissements?.voeux_date),
        "Nombre de vœux": async (data) =>
          `${await Voeu.countDocuments({
            "etablissement_accueil.uai": data.etablissements.uai,
          })}`,
        "Date du dernier import de vœux": (data) => date(data.etablissements?.voeux_date),
        Téléchargement: (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return ouiNon(!!lastDownloadDate);
        },
        "Date du dernier téléchargement": (data) => {
          const lastDownloadDate = getLastDownloadDate(data);
          console.warn(data.etablissements.uai, lastDownloadDate);
          return date(lastDownloadDate);
        },
        "Nombre de vœux téléchargés au moins une fois": async (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return `${
            lastDownloadDate
              ? await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                  $expr: {
                    $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
                  },
                })
              : 0
          }`;
        },
        "Nombre de vœux jamais téléchargés": async (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return `${
            lastDownloadDate
              ? await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                  $nor: [
                    {
                      $expr: {
                        $gt: [lastDownloadDate, { $first: "$_meta.import_dates" }],
                      },
                    },
                  ],
                })
              : await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                })
          }`;
        },
        "Nombre de vœux à télécharger (nouveau+maj)": async (data) => {
          const lastDownloadDate = getLastDownloadDate(data);

          return `${
            lastDownloadDate
              ? await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                  $expr: {
                    $lte: [lastDownloadDate, { $last: "$_meta.import_dates" }],
                  },
                })
              : await Voeu.countDocuments({
                  "etablissement_accueil.uai": data.etablissements.uai,
                })
          }`;
        },
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { exportStatutVoeux };
