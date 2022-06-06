const { oleoduc, transformData, writeData } = require("oleoduc");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByCode } = require("../common/academies");
const { Cfa } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const ReferentielApi = require("../common/api/ReferentielApi");
const { Voeu } = require("../common/model/index.js");
const Joi = require("@hapi/joi");
const { arrayOf } = require("../common/validators.js");
const { uniq } = require("lodash");

const schema = Joi.object({
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .required(),
  email: Joi.string().email().required(),
  etablissements: arrayOf().required(),
});

async function getEtablissements(uais) {
  return Promise.all(
    uniq(uais).map(async (uai) => {
      const voeu = await Voeu.findOne({ "etablissement_accueil.uai": uai });
      return {
        uai,
        ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),
      };
    })
  );
}

async function importCfas(cfaCsv, options = {}) {
  const referentielApi = options.referentielApi || new ReferentielApi();
  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  await oleoduc(
    cfaCsv,
    parseCsv({
      on_record: (record) => omitEmpty(record),
    }),
    transformData(async (json) => {
      stats.total++;
      const { error, value } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return value;
      }

      stats.invalid++;
      logger.warn(`Le cfa ${json.siret} est invalide`, error);
      return null;
    }),
    writeData(
      async (data) => {
        const { siret, email } = data;

        try {
          const etablissements = await getEtablissements(data.etablissements);
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
