const logger = require("../common/logger");
const { oleoduc, writeData, compose, transformData } = require("oleoduc");
const { Dossier } = require("../common/model/index.js");
const { parser: jsonParser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");
const { pick, sortBy } = require("lodash");
const { omitEmpty, removeDiacritics } = require("../common/utils/objectUtils.js");
const { findAcademieByDepartement, findAcademieByCodeInsee } = require("../common/academies.js");

function streamJsonArray() {
  return compose(
    jsonParser(),
    streamArray(),
    transformData((data) => data.value)
  );
}

const STATUT_MAPPER = {
  2: "inscrit",
  3: "apprenti",
  0: "abandon",
};

function getStatut(historique) {
  const now = new Date();
  const res = sortBy(historique, (h) => h.date).reverse()[0];

  if (!res) {
    return "invalide";
  }

  return new Date(res.date_statut) > now ? "inscrit" : STATUT_MAPPER[res.valeur_statut];
}
async function importDossiers(jsonStream) {
  const stats = { total: 0, created: 0, updated: 0, failed: 0 };

  await oleoduc(
    jsonStream,
    streamJsonArray(),
    writeData(
      async (data) => {
        try {
          stats.total++;
          const academie =
            findAcademieByDepartement(data.etablissement_num_departement) ||
            findAcademieByCodeInsee(data.etablissement_formateur_code_commune_insee);

          const res = await Dossier.updateOne(
            {
              dossier_id: data._id,
            },
            {
              $set: omitEmpty({
                annee_formation: data.annee_formation,
                statut: getStatut(data.historique_statut_apprenant),
                academie: academie,
                ...pick(data, [
                  "dossier_id",
                  "uai_etablissement",
                  "email_contact",
                  "formation_cfd",
                  "ine_apprenant",
                  "nom_apprenant",
                  "prenom_apprenant",
                  "contrat_date_debut",
                  "contrat_date_fin",
                  "contrat_date_rupture",
                ]),
                _meta: {
                  nom_complet: removeDiacritics(`${data.prenom_apprenant} ${data.nom_apprenant}`),
                },
              }),
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          stats.updated += res.nModified || 0;
          stats.created += (res.upserted && res.upserted.length) || 0;
        } catch (e) {
          logger.error(e, `Impossible d'importer le dossier ligne ${stats.total}`);
          stats.failed++;
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = { importDossiers };
