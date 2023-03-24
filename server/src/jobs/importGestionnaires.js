const { oleoduc, transformData, writeData } = require("oleoduc");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByCode } = require("../common/academies");
const {
  Gestionnaire,
  // Voeu
} = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const ReferentielApi = require("../common/api/ReferentielApi");
const Joi = require("@hapi/joi");
const { arrayOf } = require("../common/validators.js");
const { uniq, pick } = require("lodash");

const schema = Joi.object({
  siret: Joi.string()
    .pattern(/^[0-9]{14}$/)
    .required(),
  email: Joi.string().email().required(),
  etablissements: arrayOf().required(),
}).unknown();

async function buildEtablissements(uais, gestionnaire) {
  return Promise.all(
    uniq(uais).map(async (uai) => {
      // const voeu = await Voeu.findOne({ "etablissement_accueil.uai": uai });

      const existingEtablissement = gestionnaire?.etablissements?.find((etablissement) => etablissement === uai);
      return {
        uai,
        // ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),
        email: existingEtablissement?.email || undefined,
        diffusionAutorisee: existingEtablissement?.diffusionAutorisee || false,
      };
    })
  );
}

async function importGestionnaires(relationCsv, options = {}) {
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
        try {
          const found = await Gestionnaire.findOne({ siret }).lean();
          const formateurs = await buildEtablissements(etablissements, found);
          const organisme = await referentielApi.getOrganisme(siret).catch((error) => {
            logger.warn(error, `Le gestionnaire ${siret} n'est pas dans le référentiel`);
            return null;
          });

          if (!organisme?.adresse) {
            logger.warn(`Le gestionnaire ${siret} n'a pas d'académie`);
          }

          if (formateurs.length === 0) {
            stats.failed++;
            logger.error(`Le gestionnaire ${siret} n'a aucun établissement formateur`);
            return;
          }

          const updates = omitEmpty({
            etablissements: formateurs,
            raison_sociale: organisme?.raison_sociale || "Inconnue",
            academie: pick(findAcademieByCode(organisme?.adresse?.academie.code), ["code", "nom"]),
          });

          const res = await Gestionnaire.updateOne(
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
            logger.info(`Gestionnaire ${siret} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            logger.info(
              `Gestionnaire ${siret} mis à jour \n${JSON.stringify(
                {
                  previous: pick(found, ["formateurs", "raison_sociale", "academie"]),
                  updates,
                },
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Gestionnaire ${siret} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le cfa ${siret}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importGestionnaires;
