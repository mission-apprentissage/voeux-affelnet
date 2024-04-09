const { oleoduc, transformData, writeData } = require("oleoduc");
const { pick } = require("lodash");
const { omitEmpty } = require("../common/utils/objectUtils.js");
const logger = require("../common/logger.js");
const { findAcademieByUai } = require("../common/academies.js");
const { Responsable, Formateur } = require("../common/model/index.js");
const { parseCsv } = require("../common/utils/csvUtils.js");
const ReferentielApi = require("../common/api/ReferentielApi.js");
const Joi = require("@hapi/joi");
const { arrayOf } = require("../common/validators.js");
const { siretFormat, uaiFormat } = require("../common/utils/format.js");
const { getVoeuxDate, getNombreVoeux } = require("./countVoeux.js");
const { diff } = require("deep-object-diff");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret: Joi.string().pattern(siretFormat).required(),
  email: Joi.string().email().required(),
  etablissements: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function buildEtablissements(uais, responsable) {
  return Promise.all(
    [...new Set(uais)].map(async (uai) => {
      const formateur = await Formateur.findOne({ uai }).lean();

      const existingEtablissement = responsable?.etablissements_formateur?.find(
        (etablissement) => etablissement.uai === uai
      );

      const voeux_date = await getVoeuxDate({ uai, siret: responsable.siret });

      const nombre_voeux = await getNombreVoeux({ uai, siret: responsable.siret });

      // console.log({ siret: responsable.siret, uai, nombre_voeux, voeux_date });

      return {
        uai,
        siret: formateur?.siret,
        nombre_voeux,
        voeux_date,
        email: existingEtablissement?.email || undefined,
        diffusionAutorisee: existingEtablissement?.diffusionAutorisee || false,
        academie: pick(findAcademieByUai(uai), ["code", "nom"]),
      };
    })
  );
}

async function importResponsables(relationCsv, options = {}) {
  const referentielApi = options.referentielApi || new ReferentielApi();
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
      async ({ siret, email, etablissements }) => {
        if (siret === SIRET_RECENSEMENT) {
          return;
        }

        try {
          const found = await Responsable.findOne({ siret }).lean();
          const formateurs = await buildEtablissements(etablissements, found ?? { siret });
          let organisme;

          if (!found) {
            organisme = await referentielApi.getOrganisme(siret).catch((error) => {
              logger.warn(error, `Le responsable ${siret} n'est pas dans le référentiel`);
              return null;
            });

            if (!organisme) {
              stats.failed++;
              logger.error(`Le responsable ${siret} n'est pas dans le référentiel`);
              return;
            }
          }

          if (!found?.uai && !organisme?.uai) {
            stats.failed++;
            logger.error(`Le responsable ${siret} n'a pas d'UAI dans le référentiel`);
            return;
          }

          if (formateurs.length === 0) {
            stats.failed++;
            logger.error(`Le responsable ${siret} / ${organisme?.uai} n'a aucun établissement formateur`);
            return;
          }

          const updates = omitEmpty({
            uai: organisme?.uai ?? found?.uai,
            etablissements_formateur: formateurs,
            raison_sociale: organisme?.raison_sociale ?? found?.raison_sociale,
            academie: pick(findAcademieByUai(organisme?.uai ?? found?.uai), ["code", "nom"]),
            adresse: organisme?.adresse?.label ?? found?.adresse,
            libelle_ville: organisme?.adresse?.localite ?? found?.libelle_ville,
          });

          const res = await Responsable.updateOne(
            { siret },
            {
              $setOnInsert: {
                siret,
                username: siret,
                email,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Responsable ${siret} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, [
              "uai",
              "etablissements_formateur",
              "raison_sociale",
              "academie",
              "adresse",
              "libelle_ville",
            ]);

            logger.info(
              `Responsable ${siret} / ${organisme?.uai ?? found?.uai} mis à jour \n${JSON.stringify(
                diff(previous, updates),
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Responsable ${siret} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le responsable ${siret}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importResponsables;
