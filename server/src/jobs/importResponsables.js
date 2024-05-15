const Joi = require("@hapi/joi");
const { diff } = require("deep-object-diff");
const { oleoduc, transformData, writeData } = require("oleoduc");
const { pick } = require("lodash");
const CatalogueApi = require("../common/api/CatalogueApi");
const { findAcademieByUai } = require("../common/academies");
const { Responsable } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");
const { getCsvContent } = require("./utils/csv");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  email_responsable: Joi.string().email().required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function importResponsables(relationCsv, responsablesOverwriteCsv, options = {}) {
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());

  const overwriteArray = await getCsvContent(responsablesOverwriteCsv);

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  await oleoduc(
    relationCsv,
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
      logger.warn(`Le cfa ${json.siret_responsable} est invalide`, error);
      return null;
    }),
    writeData(
      async ({ siret_responsable, email_responsable }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return;
        }

        try {
          const found = await Responsable.findOne({ siret: siret_responsable }).lean();

          const foundOverwrite = overwriteArray.find((record) => record["Siret"] === siret_responsable);

          if (foundOverwrite) {
            logger.info(`Responsable ${siret_responsable} trouvé dans le fichier de surcharge`);
          }

          let organisme;

          if (!found) {
            organisme = await catalogueApi
              .getEtablissement({
                siret: siret_responsable,
                ...(foundOverwrite ? { uai: foundOverwrite.UAI } : {}),
                published: true,
              })
              .catch((error) => {
                logger.warn(error, `Le responsable ${siret_responsable} n'est pas dans le catalogue`);

                return null;
              });

            if (!foundOverwrite && !organisme) {
              stats.failed++;
              logger.error(`Le responsable ${siret_responsable} n'est pas dans le catalogue`);
              return;
            }
          }

          if (!foundOverwrite?.UAI && !found?.uai && !organisme?.uai) {
            stats.failed++;
            logger.error(`Impossible de trouver l'UAI du responsable ${siret_responsable}`);
            return;
          }

          const uai = foundOverwrite?.UAI ?? organisme?.uai ?? found?.uai;

          const updates = omitEmpty({
            uai,
            raison_sociale: organisme?.entreprise_raison_sociale ?? found?.raison_sociale,
            adresse: organisme
              ? [
                  organisme?.numero_voie,
                  organisme?.type_voie,
                  organisme?.nom_voie,
                  organisme?.code_postal,
                  organisme?.localite,
                ]
                  .filter((value) => !!value)
                  .join(" ")
              : found?.adresse,
            libelle_ville: organisme?.localite ?? found?.libelle_ville,
            academie: pick(findAcademieByUai(uai), ["code", "nom"]),
          });

          if (foundOverwrite?.UAI) {
            console.log({ siret_responsable, updates });
          }

          const res = await Responsable.updateOne(
            { siret: siret_responsable },
            {
              $setOnInsert: {
                siret: siret_responsable,
                username: siret_responsable,
                email: email_responsable,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Responsable ${siret_responsable} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, ["uai", "raison_sociale", "academie", "adresse", "libelle_ville"]);

            logger.info(
              `Responsable ${siret_responsable} / ${uai} mis à jour \n${JSON.stringify(
                diff(previous, updates),
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Responsable ${siret_responsable} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le responsable ${siret_responsable}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importResponsables;
