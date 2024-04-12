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
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
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
      async ({ uai_formateur, siret_responsables }) => {
        try {
          const found = await Formateur.findOne({ uai: uai_formateur }).lean();
          const responsables = await buildEtablissements(siret_responsables, found ?? { uai: uai_formateur });
          let organisme;

          const organismes = (
            await referentielApi
              .searchOrganismes({ uais: uai_formateur, etat_administratif: "actif" })
              .catch((error) => {
                logger.warn(error, `Le formateur ${uai_formateur} n'est pas dans le référentiel`);
                return null;
              })
          )?.organismes;

          if (!found) {
            if (organismes?.length > 1) {
              logger.error(`Multiples organismes trouvés dans le référentiel pour l'UAI ${uai_formateur}`);
              stats.failed++;
              return;
            }

            organisme = organismes[0];

            if (!organisme) {
              logger.error(`Le formateur ${uai_formateur} n'est pas dans le référentiel`);
              stats.failed++;
              return;
            }
          }

          if (!found?.siret && !organisme?.siret) {
            stats.failed++;
            logger.error(`Le formateur ${uai_formateur} n'a pas de siret dans le référentiel`);
            return;
          }

          const updates = omitEmpty({
            etablissements_responsable: responsables,
            siret: organisme?.siret ?? found?.siret,
            raison_sociale: organisme?.raison_sociale ?? found?.raison_sociale,
            adresse: organisme?.adresse?.label ?? found?.adresse,
            libelle_ville: organisme?.adresse?.localite ?? found?.libelle_ville,
            academie: pick(findAcademieByUai(uai_formateur), ["code", "nom"]),
          });

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

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Formateur ${uai_formateur} ajouté`);
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
              `Formateur ${uai_formateur} / ${organisme?.siret ?? found?.siret} mis à jour \n${JSON.stringify(
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
