const { oleoduc, writeData, accumulateData, flattenArray } = require("oleoduc");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Formateur } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

async function cleanFormateurs(formateursCsv, options = {}) {
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
      async (accumulator, { etablissements }) => {
        accumulator = [...new Set([...accumulator, ...etablissements.split(",")])];

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
    "Les formateurs suivants vont être supprimés :",
    JSON.stringify((await Formateur.find({ uai: { $nin: toKeep } })).map((formateur) => formateur.uai))
  );

  if (options.proceed) {
    const results = await Formateur.deleteMany({ uai: { $nin: toKeep } });

    stats.total = toKeep.length;
    stats.removed = results.deletedCount;
    stats.kept = await Formateur.countDocuments();

    return stats;
  } else {
    logger.warn("Passez l'option --proceed pour valider la suppression.");
  }
}

module.exports = { cleanFormateurs };
