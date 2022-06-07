const { Cfa } = require("../common/model");
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
        academie: (data) => data.cfa?.academie?.nom,
        siret: (data) => data.cfa?.siret,
        uai: (data) => data.etablissement?.uai,
        voeux: (data) => ouiNon(data.etablissement.voeux_date),
        voeux_date: (data) => date(data.etablissement.voeux_date),
        download: (data) => ouiNon(data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)),
        download_date: (data) =>
          date(data.cfa?.voeux_telechargements.find((v) => data.etablissement.uai === v.uai)?.date),
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = { exportStatutVoeux };
