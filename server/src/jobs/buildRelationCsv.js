const {
  compose,
  transformIntoCSV,
  oleoduc,
  accumulateData,
  flattenArray,
  mergeStreams,
  filterData,
  transformData,
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
    transformData(({ siret_gestionnaire, email_gestionnaire, uai_etablissement }) => {
      const sanitized_siret_gestionnaire = siret_gestionnaire?.replace(/\s+/g, "")?.toLowerCase();
      const sanitized_email_gestionnaire = email_gestionnaire?.replace(/\s+/g, "");
      const sanitized_uai_etablissement = uai_etablissement
        ?.replace(/\s+/g, "")
        ?.toUpperCase()
        .split(",")
        .filter((uai) => uai?.length)
        .map((uai) => uai.toUpperCase());

      return {
        siret_gestionnaire: sanitized_siret_gestionnaire.length ? sanitized_siret_gestionnaire : undefined,
        email_gestionnaire: sanitized_email_gestionnaire.length ? sanitized_email_gestionnaire : undefined,
        uai_etablissement: sanitized_uai_etablissement.length ? sanitized_uai_etablissement : [],
      };
    }),
    accumulateData(
      async (accumulator, relation) => {
        const index = accumulator.findIndex((item) => item.siret === relation.siret_gestionnaire);

        if (index === -1) {
          stats.valid++;
          accumulator.push({
            siret: relation.siret_gestionnaire,
            email: relation.email_gestionnaire,
            etablissements: [...new Set(relation.uai_etablissement)],
          });
        } else {
          accumulator[index].etablissements = [
            ...new Set([...accumulator[index].etablissements, ...relation.uai_etablissement]),
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
