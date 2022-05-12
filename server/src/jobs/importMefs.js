const logger = require("../common/logger");
const { Mef } = require("../common/model");
const { fetchStream } = require("../common/utils/httpUtils");
const { oleoduc, writeData, transformData } = require("oleoduc");
const { parseCsv } = require("../common/utils/csvUtils");

async function importMefs(options = {}) {
  let stats = { total: 0, created: 0, updated: 0, failed: 0, invalid: 0 };
  let source =
    options.csvStream ||
    (await fetchStream("https://infocentre.pleiade.education.fr/bcn/index.php/export/CSV?n=N_MEF&separator=%7C"));

  await oleoduc(
    source,
    transformData(
      (data) => {
        return data.toString().replace(/"/g, "'");
      },
      { objectMode: false }
    ),
    parseCsv({
      delimiter: "|",
    }),
    writeData(async (data) => {
      try {
        stats.total++;
        let res = await Mef.updateOne(
          {
            mef: data.MEF,
          },
          {
            $set: {
              mef: data.MEF,
              libelle_long: data.LIBELLE_LONG,
              code_formation_diplome: data.FORMATION_DIPLOME,
            },
          },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        stats.updated += res.nModified || 0;
        stats.created += (res.upserted && res.upserted.length) || 0;
      } catch (e) {
        logger.error(`Impossible d'importer le code mef  ${data.MEF}`);
        stats.failed++;
      }
    })
  );

  return stats;
}

module.exports = importMefs;
