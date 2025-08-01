const Joi = require("@hapi/joi");
const { diff } = require("deep-object-diff");
const { pick } = require("lodash");
const { oleoduc, writeData, filterData, accumulateData, flattenArray } = require("oleoduc");

const CatalogueApi = require("../common/api/CatalogueApi");
const { findAcademieByUai, findAcademieByCode } = require("../common/academies");
const { Etablissement } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { siretFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");

const SIRET_RECENSEMENT = "0000000A";

const schema = Joi.object({
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  email_responsable: Joi.string().email(),
  siret_formateurs: arrayOf(Joi.string().pattern(siretFormat)).required(),
}).unknown();

async function importEtablissements(csv, options = {}) {
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    removed: 0,
    invalid: 0,
    failed: 0,
  };

  const sirets = new Set();

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

    accumulateData(
      async (accumulator, { siret_responsable, email_responsable, siret_formateurs }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return accumulator;
        }

        if (!accumulator.has(siret_responsable)) {
          accumulator.set(siret_responsable, { types: ["Responsable"], email: email_responsable });
        } else {
          accumulator.set(siret_responsable, {
            types: [...new Set([...accumulator.get(siret_responsable).types, "Responsable"])],
            email: email_responsable,
          });
        }

        siret_formateurs.split(",").forEach((siret_formateur) => {
          if (!accumulator.has(siret_formateur)) {
            accumulator.set(siret_formateur, { types: ["Formateur"], email: accumulator.get(siret_formateur)?.email });
          } else {
            accumulator.set(siret_formateur, {
              types: [...new Set([...accumulator.get(siret_formateur).types, "Formateur"])],
              email: accumulator.get(siret_formateur)?.email,
            });
          }
        });

        return accumulator;
      },
      { accumulator: new Map() }
    ),

    accumulateData(
      async (accumulator, data) => {
        return [...data.entries()];
      },
      { accumulator: [] }
    ),

    flattenArray(),

    writeData(
      async ([siret, { types, email }]) => {
        sirets.add(siret);

        // console.log({ siret, types, email });

        if (siret === SIRET_RECENSEMENT) {
          return;
        }

        try {
          const existing = await Etablissement.findOne({ siret: siret }).lean();

          let organisme;

          // if (
          //   !existing ||
          //   !existing.email ||
          //   !existing.enseigne ||
          //   !existing.raison_sociale ||
          //   !existing.libelle_ville ||
          //   !existing.adresse ||
          //   !existing.academie
          // ) {
          const organismes = (
            await catalogueApi.getEtablissements({ siret: siret, published: true }).catch(() => {
              return null;
            })
          )?.etablissements;

          if (organismes?.length > 1) {
            logger.error(`Multiples organismes trouvés dans le catalogue pour le SIRET ${siret}`);
            stats.failed++;
            return;
          }

          organisme = await catalogueApi.getEtablissement({ siret, published: true }).catch(() => {
            return null;
          });

          if (!organisme) {
            organisme = await catalogueApi.getEtablissement({ siret }).catch(() => {
              return null;
            });
          }

          if (!organisme) {
            // stats.failed++;
            logger.warn(`L'établissement ${siret} n'est pas dans le catalogue`);
            // return;
          }
          // }

          let existingEmail = email ?? existing?.email;

          if (!existingEmail && types.includes("Responsable")) {
            // logger.debug(`Email non trouvé pour l'établissement ${siret}, recherche dans les formations Catalogue`);
            const formations = (
              await catalogueApi.getFormations({
                published: true,
                catalogue_published: true,
                etablissement_gestionnaire_siret: siret,
              })
            ).formations;
            // console.log([
            //   ...new Set([...formations.map((etablissement) => etablissement.etablissement_gestionnaire_courriel)]),
            // ]);

            const emails = new Set([
              ...formations.map((etablissement) => etablissement.etablissement_gestionnaire_courriel),
            ]);

            if (emails.size === 1 && formations[0].etablissement_gestionnaire_courriel) {
              existingEmail = formations[0].etablissement_gestionnaire_courriel;
              logger.info(`Email trouvé pour l'établissement ${siret} : "${existingEmail}"`);
            } else {
              logger.warn(`Email non trouvé pour l'établissement ${siret} `);
            }
          }

          const academie =
            organisme?.uai ?? existing?.uai
              ? findAcademieByUai(organisme?.uai ?? existing?.uai)
              : organisme?.num_academie
              ? findAcademieByCode(`${organisme.num_academie}`.padStart(2, "0"))
              : findAcademieByCode(`??`);

          const updates = omitEmpty({
            email: existingEmail,
            raison_sociale: organisme?.entreprise_raison_sociale ?? existing?.raison_sociale,
            enseigne: organisme?.enseigne ?? existing?.enseigne,
            uai: organisme?.uai ?? existing?.uai,
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
              : existing?.adresse,
            libelle_ville: organisme?.localite ?? existing?.libelle_ville,
            academie: pick(academie, ["code", "nom"]),
          });

          const res = await Etablissement.updateOne(
            { siret: siret },
            {
              $setOnInsert: {
                siret: siret,
                username: siret,
              },
              $set: updates,
              ...(existing && existing?.email !== existingEmail
                ? {
                    $push: {
                      anciens_emails: {
                        email: existing.email,
                        modification_date: new Date(),
                        auteur: process.env.VOEUX_AFFELNET_EMAIL,
                      },
                    },
                  }
                : {}),
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Etablissement ${siret} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(existing, [
              "raison_sociale",
              "enseigne",
              "uai",
              "libelle_ville",
              "adresse",
              "email",
              "academie",
            ]);

            logger.info(`Etablissement ${siret} mis à jour \n${JSON.stringify(diff(previous, updates), null, 2)}`);
          } else {
            logger.info(`Etablissement ${siret} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter l'établissement ${siret}`, error);
        }
      },
      { parallel: 1 }
    )
  );

  return stats;
}

module.exports = { importEtablissements };
