const logger = require("../common/logger");
const { oleoduc, writeData } = require("oleoduc");
const { parseCsv } = require("../common/utils/csvUtils.js");
const { markVoeuxUniquementEnApprentissage } = require("../common/actions/markVoeuxUniquementEnApprentissage.js");

async function importJeunesUniquementEnApprentissage(input) {
  const stats = { total: 0, updated: 0, failed: 0 };

  await oleoduc(
    input,
    parseCsv(),
    writeData(
      async (data) => {
        try {
          stats.total++;
          const ine = data.INE;

          const res = await markVoeuxUniquementEnApprentissage(ine);

          if (res.modifiedCount) {
            stats.updated++;
            logger.debug(`Voeu mis à jour`);
          }
        } catch (e) {
          logger.error(e, `Impossible de mettre à jour le voeu ${stats.total}`);
          stats.failed++;
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = { importJeunesUniquementEnApprentissage };
