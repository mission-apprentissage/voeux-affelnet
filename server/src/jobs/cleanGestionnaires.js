const { oleoduc, writeData, accumulateData, flattenArray } = require("oleoduc");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Gestionnaire } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

async function cleanGestionnaires(formateursCsv, options = {}) {
  const stats = {
    total: 0,
    kept: 0,
    removed: 0,
  };

  const toKeep = [];

  await oleoduc(
    formateursCsv,
    parseCsv({
      on_record: (record) => omitEmpty(record),
    }),
    accumulateData(
      async (accumulator, { siret }) => {
        accumulator = [...new Set([...accumulator, siret])];

        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    writeData(
      async (data) => {
        toKeep.push(data);
      },
      { parallel: 10 }
    )
  );

  logger.warn(
    "Les gestionnaires suivants vont être supprimés :",
    JSON.stringify((await Gestionnaire.find({ siret: { $nin: toKeep } })).map((gestionnaire) => gestionnaire.siret))
  );

  if (options.proceed) {
    const results = await Gestionnaire.deleteMany({ siret: { $nin: toKeep } });

    stats.total = toKeep.length;
    stats.removed = results.deletedCount;
    stats.kept = await Gestionnaire.countDocuments();

    return stats;
  } else {
    logger.warn("Passez l'option --proceed pour valider la suppression.");
  }
}

module.exports = { cleanGestionnaires };
