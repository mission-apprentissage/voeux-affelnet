const logger = require("../common/logger");
const {
  compose,
  transformIntoCSV,
  oleoduc,
  accumulateData,
  flattenArray,
  mergeStreams,
  filterData,
} = require("oleoduc");
const { uniq } = require("lodash");
const { parseOffreDeFormation } = require("./parsers/parseOffreDeFormation.js");
const { parseCsv } = require("../common/utils/csvUtils.js");

function parseRelationsCsv(relationsCsv) {
  return compose(relationsCsv, parseCsv());
}

function filterConflicts(onConflict = () => ({})) {
  const memo = [];

  return filterData((relation) => {
    const { uai_etablissement, siret_gestionnaire, alternatives } = relation;
    const hasConflicts = !siret_gestionnaire || alternatives?.sirets?.length > 1 || alternatives?.emails?.length > 1;
    if (!hasConflicts) {
      return true;
    }

    if (!memo.includes(uai_etablissement)) {
      memo.push(uai_etablissement);
      onConflict({
        uai: uai_etablissement,
        sirets: alternatives.sirets.join(","),
        emails: alternatives.emails.join(","),
      });
    }
    return false;
  });
}

async function buildCfaCsv(output, options = {}) {
  const conflicts = [];
  const stats = {
    total: 0,
    valid: 0,
    invalid: 0,
    conflicts: 0,
  };

  const streams = [
    compose(
      await parseOffreDeFormation(options),
      filterConflicts((c) => {
        stats.conflicts++;
        return conflicts.push(c);
      })
    ),
  ];

  if (options.relationsCsv) {
    streams.push(parseRelationsCsv(options.relationsCsv));
  }

  await oleoduc(
    mergeStreams(...streams),
    filterData(({ uai_etablissement, siret_gestionnaire, email_gestionnaire }) => {
      if (!uai_etablissement || !siret_gestionnaire || !email_gestionnaire) {
        stats.invalid++;
        return false;
      }
      return true;
    }),
    accumulateData(
      (cfas, relation) => {
        const { uai_etablissement, siret_gestionnaire, email_gestionnaire } = relation;
        const index = cfas.findIndex((item) => item.siret === siret_gestionnaire);

        if (index === -1) {
          if (!email_gestionnaire) {
            logger.warn(`Email manquant pour le CFA ${siret_gestionnaire}`);
          }
          stats.valid++;
          cfas.push({ siret: siret_gestionnaire, email: email_gestionnaire, etablissements: [uai_etablissement] });
        } else {
          cfas[index].etablissements = uniq([...cfas[index].etablissements, uai_etablissement]);
        }
        return cfas;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    transformIntoCSV(),
    output
  );

  return { stats, conflicts };
}
module.exports = buildCfaCsv;
