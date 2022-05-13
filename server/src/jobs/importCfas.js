const { oleoduc, filterData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByCode, findAcademieByName } = require("../common/academies");
const { Cfa } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const ReferentielApi = require("../common/api/ReferentielApi");
const { loadRelations, getEtablissements } = require("../common/relations");

let schema = Joi.object({
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .optional(),
  raison_sociale: Joi.string().optional(),
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

  const relations = await loadRelations(options.relationsCsv);

  await oleoduc(
    cfaCsv,
    parseCsv({
      on_record: (record) => omitEmpty(record),
    }),
    filterData(async (json) => {
      stats.total++;
      let { error } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return true;
      }

      stats.invalid++;
      logger.warn(`Le cfa ${json.siret} est invalide`, error);
      return false;
    }),
    writeData(
      async (data) => {
        let siret = data.siret;

        try {
          let organisme = await referentielApi.getOrganisme(siret);

          let res = await Cfa.updateOne(
            { siret },
            {
              $set: {
                siret,
                username: siret,
                email: data.email,
                etablissements: await getEtablissements(siret, relations),
                raison_sociale: data.raison_sociale || organisme.raison_sociale,
                academie: data.academie
                  ? findAcademieByName(data.academie)
                  : findAcademieByCode(organisme.adresse?.academie.code),
              },
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Cfa ${siret} created`);
          } else if (res.modifiedCount) {
            stats.updated++;
            logger.info(`Cfa ${siret} updated`);
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
