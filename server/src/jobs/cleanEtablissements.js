const { oleoduc, writeData, accumulateData, flattenArray } = require("oleoduc");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Etablissement } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

const SIRET_RECENSEMENT = "99999999999999";

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
      async (accumulator, { siret_responsable, siret_formateurs }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return accumulator;
        }

        accumulator = [...new Set([...accumulator, siret_responsable])];

        siret_formateurs.split(",").forEach((siret) => {
          if (siret !== SIRET_RECENSEMENT) {
            accumulator = [...new Set([...accumulator, siret])];
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
    `Les ${await Etablissement.countDocuments({
      siret: { $nin: toKeep },
    })} établissements suivants vont être supprimés :`,
    JSON.stringify((await Etablissement.find({ siret: { $nin: toKeep } })).map((etablissement) => etablissement?.siret))
  );

  if (options.proceed) {
    const results = await Etablissement.deleteMany({ siret: { $nin: toKeep } });

    stats.total = toKeep.length;
    stats.removed = results.deletedCount;
    stats.kept = await Etablissement.countDocuments();

    return stats;
  } else {
    logger.warn("Passez l'option --proceed pour valider la suppression.");
  }
}

module.exports = { cleanEtablissements };
