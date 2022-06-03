const { oleoduc, filterData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByCode } = require("../common/academies");
const { Cfa } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const ReferentielApi = require("../common/api/ReferentielApi");
const { loadRelations, getEtablissements } = require("../common/relations");

const schema = Joi.object({
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .required(),
  email: Joi.string().email().required(),
}).unknown();

async function importCfas(cfaCsv, options = {}) {
  const referentielApi = options.referentielApi || new ReferentielApi();
  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  const relations = await loadRelations(options.relations);

  await oleoduc(
    cfaCsv,
    parseCsv({
      on_record: (record) => omitEmpty(record),
    }),
    filterData(async (json) => {
      stats.total++;
      const { error } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return true;
      }

      stats.invalid++;
      logger.warn(`Le cfa ${json.siret} est invalide`, error);
      return false;
    }),
    writeData(
      async ({ siret, email }) => {
        try {
          const etablissements = await getEtablissements(siret, relations);
          const organisme = await referentielApi.getOrganisme(siret);

          if (!organisme.adresse) {
            logger.warn(`Le CFA ${siret} n'a pas d'académie`);
          }

          if (etablissements.length === 0) {
            stats.failed++;
            logger.error(`Le CFA ${siret} n'a aucun établissement`);
            return;
          }

          const res = await Cfa.updateOne(
            { siret },
            {
              $setOnInsert: {
                siret,
                username: siret,
                email,
              },
              $set: {
                etablissements,
                raison_sociale: organisme.raison_sociale,
                academie: findAcademieByCode(organisme.adresse?.academie.code),
              },
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Le CFA ${siret} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;
            logger.info(`Le CFA ${siret} mis à jour`);
          } else {
            logger.trace(`Le CFA ${siret} déjà à jour`);
          }
        } catch (e) {
          stats.failed++;
          logger.error(`Impossible de traiter le cfa ${siret}`, e);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importCfas;
