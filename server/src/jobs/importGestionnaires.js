const { oleoduc, transformData, writeData } = require("oleoduc");
const { pick } = require("lodash");
const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { findAcademieByUai } = require("../common/academies");
const { Gestionnaire, Formateur } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const ReferentielApi = require("../common/api/ReferentielApi");
const Joi = require("@hapi/joi");
const { arrayOf } = require("../common/validators.js");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { getVoeuxDate, getNombreVoeux } = require("./countVoeux");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret: Joi.string().pattern(siretFormat).required(),
  email: Joi.string().email().required(),
  etablissements: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function buildEtablissements(uais, gestionnaire) {
  return Promise.all(
    [...new Set(uais)].map(async (uai) => {
      const formateur = await Formateur.findOne({ uai }).lean();

      const existingEtablissement = gestionnaire?.etablissements?.find((etablissement) => etablissement.uai === uai);

      const voeux_date = await getVoeuxDate({ uai, siret: gestionnaire.siret });

      const nombre_voeux = await getNombreVoeux({ uai, siret: gestionnaire.siret });

      // console.log({ siret: gestionnaire.siret, uai, nombre_voeux, voeux_date });

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
        if (siret === SIRET_RECENSEMENT) {
          return;
        }

        try {
          const found = await Gestionnaire.findOne({ siret }).lean();
          const formateurs = await buildEtablissements(etablissements, found ?? { siret });
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
          // console.log(organisme);

          const updates = omitEmpty({
            uai: organisme?.uai,
            etablissements: formateurs,
            raison_sociale: organisme?.raison_sociale,
            academie: pick(findAcademieByUai(organisme?.uai), ["code", "nom"]),
            adresse: organisme?.adresse?.label,
            libelle_ville: organisme?.adresse?.localite,
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
                  previous: pick(found, ["formateurs", "raison_sociale", "academie", "adresse", "libelle_ville"]),
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
          logger.error(`Impossible de traiter le gestionnaire ${siret}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importGestionnaires;
