const Joi = require("@hapi/joi");
const { diff } = require("deep-object-diff");
const { pick } = require("lodash");
const { oleoduc, transformData, writeData } = require("oleoduc");

const CatalogueApi = require("../common/api/CatalogueApi");
const { findAcademieByUai } = require("../common/academies");
const { Etablissement } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { uaiFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");

const UAI_RECENSEMENT = "0000000A";

const schema = Joi.object({
  uai_responsable: Joi.string().pattern(uaiFormat).required(),
  email_responsable: Joi.string().email().required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function importEtablissementsResponsables(relationCsv, options = {}) {
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());
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
      logger.warn(`Le cfa ${json.siret} est invalide`, error);
      return null;
    }),
    writeData(
      async ({ uai_responsable, email_responsable }) => {
        if (uai_responsable === UAI_RECENSEMENT) {
          return;
        }

        try {
          const found = await Etablissement.findOne({ uai: uai_responsable }).lean();
          let organisme;

          if (!found) {
            const organismes = (
              await catalogueApi.getEtablissements({ uai: uai_responsable, published: true }).catch(() => {
                return null;
              })
            )?.etablissements;

            if (organismes?.length > 1) {
              logger.error(`Multiples organismes trouvés dans le catalogue pour l'UAI ${uai_responsable}`);
              stats.failed++;
              return;
            }

            organisme = await catalogueApi.getEtablissement({ uai: uai_responsable, published: true }).catch(() => {
              return null;
            });

            if (!organisme) {
              organisme = await catalogueApi.getEtablissement({ uai: uai_responsable }).catch(() => {
                return null;
              });
            }

            if (!organisme) {
              stats.failed++;
              logger.error(`Le responsable ${uai_responsable} n'est pas dans le catalogue`);
              return;
            }
          }

          const updates = omitEmpty({
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
            academie: pick(findAcademieByUai(uai_responsable), ["code", "nom"]),
          });

          const res = await Etablissement.updateOne(
            { uai: uai_responsable },
            {
              $setOnInsert: {
                uai: uai_responsable,
                username: uai_responsable,
                email: email_responsable,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Responsable ${uai_responsable} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, ["raison_sociale", "academie", "adresse", "libelle_ville"]);

            logger.info(
              `Responsable ${uai_responsable} mis à jour \n${JSON.stringify(diff(previous, updates), null, 2)}`
            );
          } else {
            logger.trace(`Responsable ${uai_responsable} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le responsable ${uai_responsable}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importEtablissementsResponsables;
