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
    // Format : uai_responsable, email_responsable, uai_formateurs
    // streams.push(parseAdditionalRelationsCsv(options.additionalRelations));

    overwriteEmails = new Map(
      (await getCsvContent(options.additionalRelations)).map(({ uai_responsable, email_responsable }) => [
        uai_responsable,
        email_responsable,
      ])
    );
  }

  await oleoduc(
    mergeStreams(...streams),

    transformData(({ uai_responsable, email_responsable, uai_formateurs }) => {
      return {
        uai_responsable,
        email_responsable: email_responsable ?? overwriteEmails.get(uai_responsable),
        uai_formateurs,
      };
    }),
    transformData(({ uai_responsable, email_responsable, uai_formateurs }) => {
      const sanitized_uai_responsable = uai_responsable?.replace(/\s+/g, "")?.toUpperCase();
      const sanitized_email_responsable = email_responsable?.replace(/\s+/g, "")?.toLowerCase();
      const sanitized_uai_formateurs = uai_formateurs
        ?.replace(/\s+/g, "")
        ?.toUpperCase()
        .split(",")
        .filter((uai) => uai?.length)
        .map((uai) => uai.toUpperCase());

      return {
        uai_responsable: sanitized_uai_responsable?.length ? sanitized_uai_responsable : undefined,
        email_responsable: sanitized_email_responsable?.length ? sanitized_email_responsable : undefined,
        uai_formateurs: sanitized_uai_formateurs?.length ? sanitized_uai_formateurs : [],
      };
    }),
    accumulateData(
      async (accumulator, relation) => {
        const index = accumulator.findIndex((item) => item.uai_responsable === relation.uai_responsable);

        if (index === -1) {
          stats.valid++;
          accumulator.push({
            uai_responsable: relation.uai_responsable,
            email_responsable: relation.email_responsable,
            uai_formateurs: [...new Set(relation.uai_formateurs)],
          });
        } else {
          accumulator[index].uai_formateurs = [
            ...new Set([...accumulator[index].uai_formateurs, ...relation.uai_formateurs]),
          ];
        }
        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    filterData((relation) => {
      if (
        !relation.uai_responsable?.length ||
        // !relation.email_responsable?.length ||
        !relation.uai_formateurs?.length
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
