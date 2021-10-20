const { oleoduc, filterData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByUai } = require("../common/academies");
const { Cfa, Voeu } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

let schema = Joi.object({
  uai: Joi.string()
    .pattern(/^[0-9]{7}[A-Z]{1}$/)
    .required(),
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .optional(),
  raison_sociale: Joi.string().optional(),
  email_directeur: Joi.string().email().optional(),
  email_contact: Joi.string().email().optional(),
})
  .or("email_directeur", "email_contact")
  .unknown();

async function importCfas(cfaCsv) {
  let stats = {
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
    filterData(async (json) => {
      stats.total++;
      let { error } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return true;
      }

      stats.invalid++;
      logger.warn(`Le cfa ${json.uai} est invalide`, error);
      return false;
    }),
    writeData(
      async (data) => {
        let uai = data.uai;

        try {
          let voeu = await Voeu.findOne({ "etablissement_accueil.uai": uai });
          let res = await Cfa.updateOne(
            { uai },
            {
              $setOnInsert: {
                uai,
                academie: findAcademieByUai(uai),
                username: uai,
                email: data.email_directeur || data.email_contact,
                email_source: data.email_directeur ? "directeur" : "contact",
              },
              $set: {
                ...(data.siret ? { siret: data.siret } : {}),
                ...(data.raison_sociale ? { raison_sociale: data.raison_sociale } : {}),
                ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),
              },
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upserted && res.upserted.length) {
            stats.created++;
            logger.info(`Cfa ${uai} created`);
          } else if (res.nModified) {
            stats.updated++;
            logger.info(`Cfa ${uai} updated`);
          }
        } catch (e) {
          stats.failed++;
          logger.error(`Impossible de traiter le cfa ${uai}`, e);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importCfas;
