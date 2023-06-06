// TODO :
// - Appeler referentiel pour récupérer raison_sociale / adresse / cp, etc...
// - Récupérer UAI formateur à la place du lieu de formation

const { oleoduc, filterData, writeData, accumulateData, flattenArray } = require("oleoduc");
const Joi = require("@hapi/joi");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Formateur, Gestionnaire } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const { pick } = require("lodash");
const { arrayOf } = require("../common/validators");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { findAcademieByUai } = require("../common/academies");
const ReferentielApi = require("../common/api/ReferentielApi");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret: Joi.string().pattern(siretFormat).required(),
  etablissements: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function buildEtablissements(sirets, formateur) {
  return Promise.all(
    [...new Set(sirets)].map(async (siret) => {
      // const voeu = await Voeu.findOne({ "etablissement_formateur.uai": uai });

      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      if (!gestionnaire) {
        console.warn(`Gestionnaire ${siret} non trouvé`);
      }
      // eslint-disable-next-line
      const existingEtablissement = formateur?.etablissements?.find((etablissement) => etablissement.siret === siret);
      return {
        siret,
        uai: gestionnaire?.uai,
        // ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),

        academie: gestionnaire?.academie,
      };
    })
  );
}

async function importFormateurs(formateursCsv, options = {}) {
  const referentielApi = options.referentielApi || new ReferentielApi();

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
        if (siret === SIRET_RECENSEMENT) {
          return accumulator;
        }

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
          const organismes = (
            await referentielApi.searchOrganismes({ uais: uai }).catch((error) => {
              logger.warn(error, `Le formateur ${uai} n'est pas dans le référentiel`);
              return null;
            })
          )?.organismes;

          if (organismes?.length > 1) {
            logger.warn(`Multiples organismes trouvés dans le référentiel pour l'UAI ${uai}`);
          }

          const organisme = organismes[0];

          const updates = omitEmpty({
            etablissements: gestionnaires,
            siret: organisme?.siret,
            raison_sociale: organisme?.raison_sociale,
            adresse: organisme?.adresse?.label,
            libelle_ville: organisme?.adresse?.localite,
            academie: pick(findAcademieByUai(uai), ["code", "nom"]),
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
