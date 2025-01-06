const Joi = require("@hapi/joi");
const { diff } = require("deep-object-diff");
const { pick } = require("lodash");
const { oleoduc, writeData, filterData, accumulateData, flattenArray } = require("oleoduc");

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
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function importEtablissementsFormateurs(formateursCsv, options = {}) {
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  await oleoduc(
    formateursCsv,
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
      logger.warn(`Le formateur ${json.uai} est invalide`, error);
      return false;
    }),
    accumulateData(
      async (accumulator, { uai_responsable, uai_formateurs }) => {
        if (uai_responsable === UAI_RECENSEMENT) {
          return accumulator;
        }

        uai_formateurs.split(",").forEach((uai_formateur) => {
          if (!accumulator.filter((acc) => acc.uai_formateur === uai_formateur).length) {
            accumulator.push({ uai_formateur, uai_responsables: [uai_responsable] });
          } else {
            accumulator = accumulator.map((acc) => {
              if (acc.uai_formateur === uai_formateur) {
                return { ...acc, uai_responsables: [...new Set([...acc.uai_responsables, uai_responsable])] };
              } else {
                return acc;
              }
            });
          }
        });

        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    writeData(
      async ({ uai_formateur /*, uai_responsables */ }) => {
        if (uai_formateur === UAI_RECENSEMENT) {
          return;
        }

        try {
          const found = await Etablissement.findOne({ uai: uai_formateur }).lean();
          // const responsables = await buildEtablissements(uai_responsables, found ?? { uai: uai_formateur });
          let organisme;

          if (!found) {
            const organismes = (
              await catalogueApi.getEtablissements({ uai: uai_formateur, published: true }).catch(() => {
                return null;
              })
            )?.etablissements;

            if (organismes?.length > 1) {
              logger.error(`Multiples organismes trouvés dans le catalogue pour l'UAI ${uai_formateur}`);
              stats.failed++;
              return;
            }

            organisme = await catalogueApi.getEtablissement({ uai: uai_formateur, published: true }).catch(() => {
              return null;
            });

            if (!organisme) {
              organisme = await catalogueApi.getEtablissement({ uai: uai_formateur }).catch(() => {
                return null;
              });
            }

            if (!organisme) {
              stats.failed++;
              logger.error(`Le formateur ${uai_formateur} n'est pas dans le catalogue`);
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
            academie: pick(findAcademieByUai(uai_formateur), ["code", "nom"]),
          });

          const res = await Etablissement.updateOne(
            { uai: uai_formateur },
            {
              $setOnInsert: {
                uai: uai_formateur,
                username: uai_formateur,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Formateur ${uai_formateur} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, ["raison_sociale", "libelle_ville", "adresse"]);

            logger.info(`Formateur ${uai_formateur} mis à jour \n${JSON.stringify(diff(previous, updates), null, 2)}`);
          } else {
            logger.trace(`Formateur ${uai_formateur} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le formateur ${uai_formateur}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importEtablissementsFormateurs;
