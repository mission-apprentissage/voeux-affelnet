const { oleoduc, filterData, writeData, accumulateData, flattenArray } = require("oleoduc");
const Joi = require("@hapi/joi");
const { pick } = require("lodash");
const { diff } = require("deep-object-diff");
const CatalogueApi = require("../common/api/CatalogueApi");
const { findAcademieByUai } = require("../common/academies");
const { Formateur } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");
const { getCsvContent } = require("./utils/csv");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function importFormateurs(relationsCsv, formateursOverwriteCsv, options = {}) {
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());

  const overwriteArray = await getCsvContent(formateursOverwriteCsv);

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  await oleoduc(
    relationsCsv,
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
      async (accumulator, { siret_responsable, uai_formateurs }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return accumulator;
        }

        uai_formateurs.split(",").forEach((uai_formateur) => {
          if (!accumulator.filter((acc) => acc.uai_formateur === uai_formateur).length) {
            accumulator.push({ uai_formateur, siret_responsables: [siret_responsable] });
          } else {
            accumulator = accumulator.map((acc) => {
              if (acc.uai_formateur === uai_formateur) {
                return { ...acc, siret_responsables: [...new Set([...acc.siret_responsables, siret_responsable])] };
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
      async ({ uai_formateur /*, siret_responsables*/ }) => {
        try {
          const found = await Formateur.findOne({ uai: uai_formateur }).lean();

          const foundOverwrite = overwriteArray.find((record) => record["UAI"] === uai_formateur);

          if (foundOverwrite) {
            logger.info(`Formateur ${uai_formateur} trouvé dans le fichier de surcharge`);
          }

          let organisme;

          if (!found) {
            let organismes = (
              await catalogueApi
                .getEtablissements({
                  uai: uai_formateur,
                  ...(foundOverwrite ? { siret: foundOverwrite.Siret } : {}),
                  published: true,
                })
                .catch(() => {
                  // logger.warn(error, `Le formateur ${uai_formateur} n'est pas dans le catalogue`);
                  return null;
                })
            )?.etablissements;

            if (!organismes?.length) {
              organismes = (
                await catalogueApi
                  .getEtablissements({
                    uai: uai_formateur,
                    ...(foundOverwrite ? { siret: foundOverwrite.Siret } : {}),
                  })
                  .catch(() => {
                    // logger.warn(error, `Le formateur ${uai_formateur} n'est pas dans le catalogue`);
                    return null;
                  })
              )?.etablissements;
            }

            if (!foundOverwrite && organismes?.length > 1) {
              const formations = (
                await catalogueApi.getFormations({
                  published: true,
                  catalogue_published: true,
                  etablissement_formateur_uai: uai_formateur,
                  affelnet_perimetre: true,
                })
              ).formations;

              const sirets = formations.reduce((acc, formation) => {
                acc.add(formation.etablissement_formateur_siret);
                return acc;
              }, new Set());

              if (sirets.size === 1) {
                organismes = (await catalogueApi.getEtablissements({ siret: [...sirets][0], published: true }))
                  ?.etablissements;
              }

              if (organismes?.length !== 1) {
                logger.error(
                  `Multiples organismes trouvés dans le catalogue pour l'UAI ${uai_formateur} et pas de siret unique trouvé dans les formations (${[
                    ...sirets,
                  ].join(", ")}})`
                );

                stats.failed++;
                return;
              }
            }

            if (!foundOverwrite && !organismes?.length) {
              logger.error(`Le formateur ${uai_formateur} n'est pas dans le catalogue`);
              stats.failed++;
              return;
            }

            organisme = organismes[0];
          }

          if (!foundOverwrite?.Siret && !found?.siret && !organisme?.siret) {
            stats.failed++;
            logger.error(`Impossible de trouver le siret du formateur ${uai_formateur}`);
            return;
          }

          const siret = foundOverwrite?.Siret ?? organisme?.siret ?? found?.siret;

          const updates = omitEmpty({
            siret,
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

          // console.log({ uai_formateur, updates });

          const res = await Formateur.updateOne(
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

          // if (foundOverwrite?.Siret) {
          //   console.log({ uai_formateur, updates });
          // }

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Formateur ${uai_formateur} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, ["siret", "raison_sociale", "libelle_ville", "adresse"]);

            logger.info(
              `Formateur ${uai_formateur} / ${updates?.siret} mis à jour \n${JSON.stringify(
                diff(previous, updates),
                null,
                2
              )}`
            );
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

module.exports = importFormateurs;
