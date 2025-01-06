const { oleoduc, writeData, accumulateData, flattenArray } = require("oleoduc");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Etablissement } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

const UAI_RECENSEMENT = "0000000A";

async function cleanEtablissements(relationsCsv, options = {}) {
  const stats = {
    total: 0,
    kept: 0,
    removed: 0,
  };

  const toKeep = [];

  await oleoduc(
    relationsCsv,
    parseCsv({
      on_record: (record) => omitEmpty(record),
    }),
    accumulateData(
      async (accumulator, { uai_responsable, uai_formateurs }) => {
        if (uai_responsable === UAI_RECENSEMENT) {
          return accumulator;
        }

        accumulator = [...new Set([...accumulator, uai_responsable])];

        uai_formateurs.split(",").forEach((uai) => {
          if (uai !== UAI_RECENSEMENT) {
            accumulator = [...new Set([...accumulator, uai])];
          }
        });

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
    "Les établissement suivants vont être supprimés :",
    JSON.stringify((await Etablissement.find({ uai: { $nin: toKeep } })).map((etablissement) => etablissement?.uai))
  );

  if (options.proceed) {
    const results = await Etablissement.deleteMany({ uai: { $nin: toKeep } });

    stats.total = toKeep.length;
    stats.removed = results.deletedCount;
    stats.kept = await Etablissement.countDocuments();

    return stats;
  } else {
    logger.warn("Passez l'option --proceed pour valider la suppression.");
  }
}

module.exports = { cleanEtablissements };
