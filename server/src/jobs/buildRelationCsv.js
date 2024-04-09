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
    // Format : siret_responsable, email_responsable, uai_formateurs
    streams.push(parseAdditionalRelationsCsv(options.additionalRelations));
  }

  await oleoduc(
    mergeStreams(...streams),
    transformData(({ siret_responsable, email_responsable, uai_formateurs }) => {
      const sanitized_siret_responsable = siret_responsable?.replace(/\s+/g, "")?.toLowerCase();
      const sanitized_email_responsable = email_responsable?.replace(/\s+/g, "");
      const sanitized_uai_formateurs = uai_formateurs
        ?.replace(/\s+/g, "")
        ?.toUpperCase()
        .split(",")
        .filter((uai) => uai?.length)
        .map((uai) => uai.toUpperCase());

      return {
        siret_responsable: sanitized_siret_responsable?.length ? sanitized_siret_responsable : undefined,
        email_responsable: sanitized_email_responsable?.length ? sanitized_email_responsable : undefined,
        uai_formateurs: sanitized_uai_formateurs?.length ? sanitized_uai_formateurs : [],
      };
    }),
    accumulateData(
      async (accumulator, relation) => {
        const index = accumulator.findIndex((item) => item.siret === relation.siret_responsable);

        if (index === -1) {
          stats.valid++;
          accumulator.push({
            siret: relation.siret_responsable,
            email: relation.email_responsable,
            etablissements: [...new Set(relation.uai_formateurs)],
          });
        } else {
          accumulator[index].etablissements = [
            ...new Set([...accumulator[index].etablissements, ...relation.uai_formateurs]),
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
