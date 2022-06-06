const { compose, transformIntoCSV, oleoduc, accumulateData, flattenArray, mergeStreams } = require("oleoduc");
const { uniq } = require("lodash");
const { getRelationsFromOffreDeFormation } = require("./utils/getRelationsFromOffreDeFormation.js");
const { parseCsv } = require("../common/utils/csvUtils.js");
const { Cfa } = require("../common/model/index.js");

function parseRelationsCsv(relationsCsv) {
  return compose(relationsCsv, parseCsv());
}

async function getCfaStatut(siret, uai) {
  const found = await Cfa.findOne({ siret });

  if (!found) {
    return "absent";
  }

  return found.etablissements.find((e) => e.uai === uai) ? "présent" : "maj";
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
    await getRelationsFromOffreDeFormation({
      ...options,
      onConflict: (c) => {
        stats.conflicts++;
        return conflicts.push(c);
      },
    }),
  ];

  if (options.relationsCsv) {
    streams.push(parseRelationsCsv(options.relationsCsv));
  }

  await oleoduc(
    mergeStreams(...streams),
    accumulateData(
      async (cfas, relation) => {
        if (!relation.uai_etablissement || !relation.siret_gestionnaire || !relation.email_gestionnaire) {
          stats.invalid++;
          return cfas;
        }

        const index = cfas.findIndex((item) => item.siret === relation.siret_gestionnaire);

        if (index === -1) {
          stats.valid++;
          cfas.push({
            siret: relation.siret_gestionnaire,
            email: relation.email_gestionnaire,
            etablissements: [relation.uai_etablissement],
            statut: await getCfaStatut(relation.siret_gestionnaire, relation.uai_etablissement),
          });
        } else {
          cfas[index].etablissements = uniq([...cfas[index].etablissements, relation.uai_etablissement]);
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
