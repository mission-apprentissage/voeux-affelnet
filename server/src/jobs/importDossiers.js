const logger = require("../common/logger");
const { oleoduc, writeData, compose } = require("oleoduc");
const { Dossier } = require("../common/model");
const { pick, sortBy } = require("lodash");
const { omitEmpty, removeDiacritics } = require("../common/utils/objectUtils.js");
const { findAcademieByDepartement, findAcademieByCodeInsee } = require("../common/academies.js");
const { streamJsonArray } = require("../common/utils/streamUtils.js");
const TableauDeBordApi = require("../common/api/TableauDeBordApi.js");

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

function parseFile(input) {
  return compose(input, streamJsonArray());
}

function addImportDate(dossierId) {
  return Dossier.updateOne(
    {
      dossier_id: dossierId,
    },
    {
      $push: {
        "_meta.import_dates": new Date(),
      },
    },
    { upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function importDossiers(options = {}) {
  const tableauDeBordApi = options.tdbApi || new TableauDeBordApi();
  const stats = { total: 0, created: 0, updated: 0, failed: 0 };

  const stream = options.input ? parseFile(options.input) : await tableauDeBordApi.streamDossiers();

  await oleoduc(
    stream,
    writeData(
      async (data) => {
        try {
          stats.total++;
          const dossierId = data._id;
          const academie =
            findAcademieByDepartement(data.etablissement_num_departement) ||
            findAcademieByCodeInsee(data.etablissement_formateur_code_commune_insee);

          const res = await Dossier.updateOne(
            {
              dossier_id: dossierId,
            },
            {
              $setOnInsert: {
                "_meta.import_dates": [new Date()],
              },
              $set: omitEmpty({
                annee_formation: data.annee_formation,
                statut: getStatut(data.historique_statut_apprenant),
                "_meta.nom_complet": removeDiacritics(`${data.prenom_apprenant} ${data.nom_apprenant}`),
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
              }),
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.debug(`Nouveau dossier ajouté : ${dossierId}`);
          } else if (res.modifiedCount) {
            stats.updated++;
            await addImportDate(dossierId);
            logger.debug(`Dossier ${dossierId} mis à jour`);
          }
        } catch (e) {
          logger.error(e, `Impossible d'importer le dossier à la ligne ${stats.total}`);
          stats.failed++;
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = { importDossiers };
