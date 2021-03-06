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
const { uniq, pick } = require("lodash");

const schema = Joi.object({
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .required(),
  email: Joi.string().email().required(),
  etablissements: arrayOf().required(),
}).unknown();

async function buildEtablissements(uais) {
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
          const etablissements = await buildEtablissements(data.etablissements);
          const found = await Cfa.findOne({ siret }).lean();
          const organisme = await referentielApi.getOrganisme(siret).catch((e) => {
            logger.warn(e, `Le CFA ${siret} n'est pas dans le r??f??rentiel`);
            return null;
          });

          if (!organisme?.adresse) {
            logger.warn(`Le CFA ${siret} n'a pas d'acad??mie`);
          }

          if (etablissements.length === 0) {
            stats.failed++;
            logger.error(`Le CFA ${siret} n'a aucun ??tablissement`);
            return;
          }

          const updates = omitEmpty({
            etablissements,
            raison_sociale: organisme?.raison_sociale || "Inconnue",
            academie: pick(findAcademieByCode(organisme?.adresse?.academie.code), ["code", "nom"]),
          });

          const res = await Cfa.updateOne(
            { siret },
            {
              $setOnInsert: {
                siret,
                username: siret,
                email,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`CFA ${siret} ajout??`);
          } else if (res.modifiedCount) {
            stats.updated++;

            logger.info(
              `CFA ${siret} mis ?? jour \n${JSON.stringify(
                {
                  previous: pick(found, ["etablissements", "raison_sociale", "academie"]),
                  updates,
                },
                null,
                2
              )}`
            );
          } else {
            logger.trace(`CFA ${siret} d??j?? ?? jour`);
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
