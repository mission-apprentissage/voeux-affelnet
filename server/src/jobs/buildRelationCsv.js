const { compose, transformIntoCSV, oleoduc, accumulateData, flattenArray, mergeStreams } = require("oleoduc");
const { uniq } = require("lodash");
const { getRelationsFromOffreDeFormation } = require("./utils/getRelationsFromOffreDeFormation.js");
const { parseCsv } = require("../common/utils/csvUtils.js");
// const { Gestionnaire } = require("../common/model/index.js");

function parseAdditionalRelationsCsv(csv) {
  return compose(csv, parseCsv());
}

// async function getGestionnaireStatut({ siret, uai }) {
//   const found = await Gestionnaire.findOne({ siret });

//   if (!found) {
//     return "nouveau";
//   }

//   return found.etablissements.find((e) => e.uai === uai) ? "importé" : "maj nécessaire";
// }

async function buildRelationCsv(output, options = {}) {
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

  if (options.additionalRelations) {
    streams.push(parseAdditionalRelationsCsv(options.additionalRelations));
  }

  await oleoduc(
    mergeStreams(...streams),
    accumulateData(
      async (gestionnaires, relation) => {
        if (!relation.uai_etablissement || !relation.siret_gestionnaire || !relation.email_gestionnaire) {
          stats.invalid++;
          return gestionnaires;
        }

        const index = gestionnaires.findIndex((item) => item.siret === relation.siret_gestionnaire);
        // const formateurIndex = gestionnaires.findIndex((item) => item.etablissements?.includes(etablissement => etablissement === ) === relation.siret_gestionnaire)

        if (index === -1) {
          stats.valid++;
          gestionnaires.push({
            siret: relation.siret_gestionnaire,
            email: relation.email_gestionnaire,
            etablissements: relation.uai_etablissement.split(","),
            // statut: await getGestionnaireStatut({
            //   siret: relation.siret_gestionnaire,
            //   uai: relation.uai_etablissement,
            // }),
          });
        } else {
          gestionnaires[index].etablissements = uniq([
            ...gestionnaires[index].etablissements,
            relation.uai_etablissement,
          ]);
        }
        return gestionnaires;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    transformIntoCSV(),
    output
  );

  return { stats, conflicts };
}
module.exports = buildRelationCsv;
