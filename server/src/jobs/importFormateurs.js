// TODO :
// - Appeler referentiel pour récupérer raison_sociale / adresse / cp, etc...
// - Récupérer UAI formateur à la place du lieu de formation

const { oleoduc, filterData, writeData, accumulateData, flattenArray } = require("oleoduc");
const Joi = require("@hapi/joi");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Formateur, Responsable } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const { pick } = require("lodash");
const { arrayOf } = require("../common/validators");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { findAcademieByUai } = require("../common/academies");
const ReferentielApi = require("../common/api/ReferentielApi");
const { getNombreVoeux, getVoeuxDate } = require("./countVoeux");
const { diff } = require("deep-object-diff");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret: Joi.string().pattern(siretFormat).required(),
  etablissements: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function buildEtablissements(sirets, formateur) {
  return Promise.all(
    [...new Set(sirets)].map(async (siret) => {
      // const voeu = await Voeu.findOne({ "etablissement_formateur.uai": uai });

      const responsable = await Responsable.findOne({ siret }).lean();

      if (!responsable) {
        console.warn(`Responsable ${siret} non trouvé`);
      }
      // eslint-disable-next-line
      const existingEtablissement = formateur?.etablissements_responsable?.find(
        (etablissement) => etablissement.siret === siret
      );

      const voeux_date = await getVoeuxDate({ uai: formateur.uai, siret });

      const nombre_voeux = await getNombreVoeux({ uai: formateur.uai, siret });

      return {
        siret,
        uai: responsable?.uai,
        // ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),
        nombre_voeux,
        voeux_date,
        academie: responsable?.academie,
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
          const responsables = await buildEtablissements(etablissements, found ?? { uai });
          let organisme;

          const organismes = (
            await referentielApi.searchOrganismes({ uais: uai, etat_administratif: "actif" }).catch((error) => {
              logger.warn(error, `Le formateur ${uai} n'est pas dans le référentiel`);
              return null;
            })
          )?.organismes;

          if (!found) {
            if (organismes?.length > 1) {
              logger.error(`Multiples organismes trouvés dans le référentiel pour l'UAI ${uai}`);
              stats.failed++;
              return;
            }

            organisme = organismes[0];

            if (!organisme) {
              logger.error(`Le formateur ${uai} n'est pas dans le référentiel`);
              stats.failed++;
              return;
            }
          }

          if (!found?.siret && !organisme?.siret) {
            stats.failed++;
            logger.error(`Le formateur ${uai} n'a pas de siret dans le référentiel`);
            return;
          }

          const updates = omitEmpty({
            etablissements_responsable: responsables,
            siret: organisme?.siret ?? found?.siret,
            raison_sociale: organisme?.raison_sociale ?? found?.raison_sociale,
            adresse: organisme?.adresse?.label ?? found?.adresse,
            libelle_ville: organisme?.adresse?.localite ?? found?.libelle_ville,
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

            const previous = pick(found, [
              "siret",
              "etablissements_responsable",
              "raison_sociale",
              "libelle_ville",
              "adresse",
            ]);

            logger.info(
              `Formateur ${uai} / ${organisme?.siret ?? found?.siret} mis à jour \n${JSON.stringify(
                diff(previous, updates),
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
