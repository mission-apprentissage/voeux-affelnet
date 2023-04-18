const {
  compose,
  transformIntoCSV,
  oleoduc,
  accumulateData,
  flattenArray,
  mergeStreams,
  filterData,
} = require("oleoduc");
const { Readable } = require("stream");
const { getRelationsFromOffreDeFormation } = require("./utils/getRelationsFromOffreDeFormation.js");
const { parseCsv } = require("../common/utils/csvUtils.js");

function parseAdditionalRelationsCsv(csv) {
  return compose(csv, parseCsv());
}

async function buildRelationCsv({ outputRelations, outputInvalids }, options = {}) {
  const stats = {
    total: 0,
    valid: 0,
    invalid: 0,
    conflicts: 0,
  };
  const conflicts = [];
  const invalids = [];

  const streams = [
    await getRelationsFromOffreDeFormation({
      ...options,
      onConflict: (c) => {
        stats.conflicts++;
        return conflicts.push(c);
      },
    }),
  ];

  if (options.additionalRelations) {
    streams.push(parseAdditionalRelationsCsv(options.additionalRelations));
  }

  await oleoduc(
    mergeStreams(...streams),
    accumulateData(
      async (accumulator, relation) => {
        const index = accumulator.findIndex((item) => item.siret === relation.siret_gestionnaire);

        if (index === -1) {
          stats.valid++;
          accumulator.push({
            siret: relation.siret_gestionnaire,
            email: relation.email_gestionnaire,
            etablissements: [
              ...new Set(
                relation.uai_etablissement
                  .split(",")
                  .map((uai) => uai.toUpperCase())
                  .filter((uai) => uai?.length)
              ),
            ],
          });
        } else {
          accumulator[index].etablissements = [
            ...new Set([
              ...accumulator[index].etablissements,
              ...relation.uai_etablissement.split(",").map((uai) => uai.toUpperCase()),
            ]),
          ];
        }
        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    filterData((relation) => {
      if (!relation.siret?.length || !relation.email?.length || !relation.etablissements?.length) {
        stats.invalid++;
        invalids.push(relation);
        return false;
      }

      return relation;
    }),
    transformIntoCSV(),
    outputRelations
  );

  await oleoduc(Readable.from(invalids), transformIntoCSV(), outputInvalids);

  return { stats };
}
module.exports = buildRelationCsv;
