const { oleoduc, writeData, accumulateData, flattenArray } = require("oleoduc");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Responsable } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

const SIRET_RECENSEMENT = "99999999999999";

async function cleanResponsables(formateursCsv, options = {}) {
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
      async (accumulator, { siret_responsable }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return accumulator;
        }

        accumulator = [...new Set([...accumulator, siret_responsable])];

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
    "Les responsables suivants vont être supprimés :",
    JSON.stringify(
      (await Responsable.find({ $or: [{ siret: { $nin: toKeep } }, { siret: SIRET_RECENSEMENT }] })).map(
        (responsable) => responsable.siret
      )
    )
  );

  if (options.proceed) {
    const results = await Responsable.deleteMany({ siret: { $nin: toKeep } });

    stats.total = toKeep.length;
    stats.removed = results.deletedCount;
    stats.kept = await Responsable.countDocuments();

    return stats;
  } else {
    logger.warn("Passez l'option --proceed pour valider la suppression.");
  }
}

module.exports = { cleanResponsables };
