const logger = require("../common/logger");
const { Mef } = require("../common/model");
const { fetchStream } = require("../common/utils/httpUtils");
const { oleoduc, writeData, transformData } = require("oleoduc");
const { parseCsv } = require("../common/utils/csvUtils");

const mefURL = "https://bcn.depp.education.fr/bcn/index.php/export/CSV?n=N_MEF&separator=%7C";
// const mefURL = "https://infocentre.pleiade.education.fr/bcn/index.php/export/CSV?n=N_MEF&separator=%7C";

async function importMefs(options = {}) {
  const stats = { total: 0, created: 0, updated: 0, failed: 0, invalid: 0 };
  const source = options.csvStream || (await fetchStream(mefURL));

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
    writeData(
      async (data) => {
        try {
          stats.total++;
          const res = await Mef.updateOne(
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

          stats.updated += res.modifiedCount || 0;
          stats.created += res.upsertedCount || 0;
        } catch (e) {
          logger.error(`Impossible d'importer le code mef  ${data.MEF}`);
          stats.failed++;
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importMefs;
