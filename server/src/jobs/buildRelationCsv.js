const {
  // compose,
  transformIntoCSV,
  oleoduc,
  accumulateData,
  flattenArray,
  mergeStreams,
  filterData,
  transformData,
} = require("oleoduc");
const { Readable } = require("stream");
const { streamOffreDeFormation } = require("./utils/offreDeFormation.js");
// const { parseCsv } = require("../common/utils/csvUtils.js");
const { getCsvContent } = require("./utils/csv.js");

// function parseAdditionalRelationsCsv(csv) {
//   return compose(csv, parseCsv());
// }

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
    await streamOffreDeFormation({
      ...options,
      onConflict: (c) => {
        stats.conflicts++;
        return conflicts.push(c);
      },
    }),
  ];

  let overwriteEmails = new Map();

  if (options.additionalRelations) {
    // Format : siret_responsable, email_responsable, siret_formateurs
    // streams.push(parseAdditionalRelationsCsv(options.additionalRelations));

    overwriteEmails = new Map(
      (await getCsvContent(options.additionalRelations)).map(({ siret_responsable, email_responsable }) => [
        siret_responsable,
        email_responsable,
      ])
    );
  }

  await oleoduc(
    mergeStreams(...streams),

    transformData(({ siret_responsable, email_responsable, siret_formateurs }) => {
      return {
        siret_responsable,
        email_responsable: email_responsable ?? overwriteEmails.get(siret_responsable),
        siret_formateurs,
      };
    }),
    transformData(({ siret_responsable, email_responsable, siret_formateurs }) => {
      const sanitized_siret_responsable = siret_responsable?.replace(/\s+/g, "")?.toUpperCase();
      const sanitized_email_responsable = email_responsable?.replace(/\s+/g, "")?.toLowerCase();
      const sanitized_siret_formateurs = siret_formateurs
        ?.replace(/\s+/g, "")
        ?.toUpperCase()
        .split(",")
        .filter((siret) => siret?.length)
        .map((siret) => siret.toUpperCase());

      return {
        siret_responsable: sanitized_siret_responsable?.length ? sanitized_siret_responsable : undefined,
        email_responsable: sanitized_email_responsable?.length ? sanitized_email_responsable : undefined,
        siret_formateurs: sanitized_siret_formateurs?.length ? sanitized_siret_formateurs : [],
      };
    }),
    accumulateData(
      async (accumulator, relation) => {
        const index = accumulator.findIndex((item) => item.siret_responsable === relation.siret_responsable);

        if (index === -1) {
          stats.valid++;
          accumulator.push({
            siret_responsable: relation.siret_responsable,
            email_responsable: relation.email_responsable,
            siret_formateurs: [...new Set(relation.siret_formateurs)],
          });
        } else {
          accumulator[index].siret_formateurs = [
            ...new Set([...accumulator[index].siret_formateurs, ...relation.siret_formateurs]),
          ];
        }
        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    filterData((relation) => {
      if (
        !relation.siret_responsable?.length ||
        // !relation.email_responsable?.length ||
        !relation.siret_formateurs?.length
      ) {
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
