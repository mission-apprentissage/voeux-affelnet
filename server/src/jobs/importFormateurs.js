const { oleoduc, filterData, writeData, accumulateData, flattenArray } = require("oleoduc");
const Joi = require("@hapi/joi");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Formation, Formateur } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const { pick } = require("lodash");
const { arrayOf } = require("../common/validators");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { findAcademieByUai } = require("../common/academies");

const schema = Joi.object({
  siret: Joi.string().pattern(siretFormat).required(),
  etablissements: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function buildEtablissements(sirets, formateur) {
  return Promise.all(
    [...new Set(sirets)].map(async (siret) => {
      // const voeu = await Voeu.findOne({ "etablissement_accueil.uai": uai });

      // eslint-disable-next-line
      const existingEtablissement = formateur?.etablissements?.find((etablissement) => etablissement === siret);
      return {
        siret,
        // ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),

        // academie: findAcademie
      };
    })
  );
}

async function importFormateurs(
  formateursCsv
  // options = {}
) {
  // const referentielApi = options.referentielApi || new ReferentielApi();

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
      async (accumulator, { siret, etablissements }) => {
        etablissements.split(",").forEach((uai) => {
          if (!accumulator.filter((acc) => acc.uai === uai).length) {
            accumulator.push({ uai, etablissements: [siret] });
          } else {
            accumulator = accumulator.map((acc) => {
              if (acc.uai === uai) {
                return { ...acc, etablissements: [...new Set([...acc.etablissements, siret])] };
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
      async ({ uai, etablissements }) => {
        try {
          const found = await Formateur.findOne({ uai }).lean();
          const gestionnaires = await buildEtablissements(etablissements, found);
          // const organisme = await referentielApi.getOrganisme(uai).catch((error) => {
          //   logger.warn(error, `Le formateur ${uai} n'est pas dans le référentiel`);
          //   return null;
          // });

          const formations = await Formation.find({ uai, siret_uai_gestionnaires: { $in: etablissements } });

          // console.log(formations);

          /** Add unique libelle_etablissement to an aray */
          const raison_sociale = formations.reduce((acc, value) => {
            if (!acc.includes(value.libelle_etablissement)) {
              acc.push(value.libelle_etablissement);
            }
            return acc;
          }, []);

          if (raison_sociale.length > 1) {
            logger.warn(`Multiple libellés pour l'uai ${uai}`);
            return;
          }

          const libelle_ville = formations.reduce((acc, value) => {
            if (!acc.includes(value.libelle_ville)) {
              acc.push(value.libelle_ville);
            }
            return acc;
          }, []);

          const adresse = formations.reduce((acc, value) => {
            if (!acc.includes(value.adresse)) {
              acc.push(value.adresse);
            }
            return acc;
          }, []);

          const cp = formations.reduce((acc, value) => {
            if (!acc.includes(value.cp)) {
              acc.push(value.cp);
            }
            return acc;
          }, []);

          const commune = formations.reduce((acc, value) => {
            if (!acc.includes(value.commune)) {
              acc.push(value.commune);
            }
            return acc;
          }, []);

          if (gestionnaires.length === 0) {
            stats.failed++;
            logger.error(`Le formateur ${uai} n'a aucun établissement gestionnaire`);
            return;
          }

          const updates = omitEmpty({
            etablissements: gestionnaires,
            raison_sociale: raison_sociale[0],
            libelle_ville: libelle_ville[0],
            adresse: adresse[0],
            cp: cp[0],
            commune: commune[0],
            academie: pick(findAcademieByUai(uai), ["code", "nom"]),

            // raison_sociale: organisme?.raison_sociale || "Inconnue",
            // academie: pick(findAcademieByCode(organisme?.adresse?.academie.code), ["code", "nom"]),
          });

          const res = await Formateur.updateOne(
            { uai },
            {
              $setOnInsert: {
                uai,
                username: uai,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Formateur ${uai} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            logger.info(
              `Formateur ${uai} mis à jour \n${JSON.stringify(
                {
                  previous: pick(found, [
                    "etablissements",
                    "raison_sociale",
                    "libelle_ville",
                    "adresse",
                    "cp",
                    "commune" /*, "academie"*/,
                  ]),
                  updates,
                },
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Formateur ${uai} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le formateur ${uai}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importFormateurs;
