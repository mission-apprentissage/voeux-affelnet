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
  // email_responsable: Joi.string().email().required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function importEtablissements(csv, options = {}) {
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  await oleoduc(
    csv,
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
      logger.warn(`La ligne ${JSON.stringify(json)} est invalide`, error);
      return false;
    }),
    // TODO : Modifier pour gérer email_responsable, conserver le type d'UAI (responsable / formateur) pour déterminer si on recherche le mail ensuite
    accumulateData(
      async (accumulator, { uai_responsable, uai_formateurs }) => {
        if (uai_responsable === UAI_RECENSEMENT) {
          return accumulator;
        }

        accumulator = [...new Set([...accumulator, uai_responsable])];

        uai_formateurs.split(",").forEach((uai) => {
          if (uai !== UAI_RECENSEMENT) {
            accumulator = [...new Set([...accumulator, uai])];
          }
        });

        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    writeData(
      async (uai) => {
        if (uai === UAI_RECENSEMENT) {
          return;
        }

        try {
          const found = await Etablissement.findOne({ uai: uai }).lean();
          let organisme;

          if (!found) {
            const organismes = (
              await catalogueApi.getEtablissements({ uai: uai, published: true }).catch(() => {
                return null;
              })
            )?.etablissements;

            if (organismes?.length > 1) {
              logger.error(`Multiples organismes trouvés dans le catalogue pour l'UAI ${uai}`);
              stats.failed++;
              return;
            }

            organisme = await catalogueApi.getEtablissement({ uai: uai, published: true }).catch(() => {
              return null;
            });

            if (!organisme) {
              organisme = await catalogueApi.getEtablissement({ uai: uai }).catch(() => {
                return null;
              });
            }

            if (!organisme) {
              stats.failed++;
              logger.error(`L'établissement ${uai} n'est pas dans le catalogue`);
              return;
            }
          }

          let email = found?.email;

          if (!email) {
            // logger.debug(`Email non trouvé pour l'établissement ${uai}, recherche dans les formations Catalogue`);
            const formations = (
              await catalogueApi.getFormations({
                published: true,
                catalogue_published: true,
                etablissement_gestionnaire_uai: uai,
              })
            ).formations;
            // console.log([
            //   ...new Set([...formations.map((etablissement) => etablissement.etablissement_gestionnaire_courriel)]),
            // ]);

            const emails = new Set([
              ...formations.map((etablissement) => etablissement.etablissement_gestionnaire_courriel),
            ]);

            if (emails.size === 1) {
              email = formations[0].etablissement_gestionnaire_courriel;
              logger.info(`Email trouvé pour l'établissement ${uai} : "${email}"`);
            } else {
              logger.warn(`Email non trouvé pour l'établissement ${uai} `);
            }
          }

          const updates = omitEmpty({
            email,
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

          const res = await Etablissement.updateOne(
            { uai: uai },
            {
              $setOnInsert: {
                uai: uai,
                username: uai,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Etablissement ${uai} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, ["raison_sociale", "libelle_ville", "adresse", "email", "academie"]);

            logger.info(`Etablissement ${uai} mis à jour \n${JSON.stringify(diff(previous, updates), null, 2)}`);
          } else {
            logger.trace(`Etablissement ${uai} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter l'établissement ${uai}`, error);
        }
      },
      { parallel: 1 }
    )
  );

  return stats;
}

module.exports = { importEtablissements };
