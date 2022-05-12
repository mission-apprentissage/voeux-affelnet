const { oleoduc, filterData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByCode } = require("../common/academies");
const { Cfa, Voeu } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const ReferentielApi = require("../common/api/ReferentielApi");

let schema = Joi.object({
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .optional(),
  raison_sociale: Joi.string().optional(),
  email: Joi.string().email().required(),
  email_source: Joi.string().optional(),
}).unknown();

async function loadRelations(relationCsv) {
  let relations = {};

  await oleoduc(
    relationCsv,
    parseCsv(),
    writeData((data) => {
      let siret = data["SIRET_UAI_GESTIONNAIRE"];
      if (!relations[siret]) {
        relations[siret] = [];
      }

      relations[siret].push(data["UAI"]);
    })
  );

  return relations;
}

async function importCfas(cfaCsv, relationsCsv, options = {}) {
  const referentielApi = options.referentielApi || new ReferentielApi();
  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  const relations = await loadRelations(relationsCsv);

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
          let uais = relations[siret] || [];
          let etablissements = await Promise.all(
            uais.map(async (uai) => {
              const voeu = await Voeu.findOne({ "etablissement_accueil.uai": { $in: uais } });
              return {
                uai,
                ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),
              };
            })
          );

          let res = await Cfa.updateOne(
            { siret },
            {
              $setOnInsert: {
                siret,
                academie: findAcademieByCode(organisme.adresse?.academie.code),
                username: siret,
                email: data.email,
                email_source: data.email_source,
              },
              $set: {
                etablissements,
                ...(data.raison_sociale ? { raison_sociale: data.raison_sociale } : {}),
              },
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upserted && res.upserted.length) {
            stats.created++;
            logger.info(`Cfa ${siret} created`);
          } else if (res.nModified) {
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
