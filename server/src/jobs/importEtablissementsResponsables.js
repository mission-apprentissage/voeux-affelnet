const Joi = require("@hapi/joi");
const { diff } = require("deep-object-diff");
const { pick } = require("lodash");
const { oleoduc, transformData, writeData } = require("oleoduc");

const CatalogueApi = require("../common/api/CatalogueApi");
// const ReferentielApi = require("../common/api/ReferentielApi");
const { findAcademieByUai } = require("../common/academies");
const { Etablissement } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");
const { getVoeuxDate, getNombreVoeux } = require("./countVoeux");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  email_responsable: Joi.string().email().required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function buildEtablissements(uais, responsable) {
  return Promise.all(
    [...new Set(uais)].map(async (uai) => {
      const formateur = await Etablissement.findOne({ uai }).lean();

      // if (!formateur) {
      //   logger.warn(`Formateur ${uai} non trouvé`);
      // }

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
        diffusion_autorisee: existingEtablissement?.diffusion_autorisee || false,
        academie: pick(findAcademieByUai(uai), ["code", "nom"]),
      };
    })
  );
}

async function importEtablissementsResponsables(relationCsv, options = {}) {
  // const referentielApi = options.referentielApi || new ReferentielApi();
  const catalogueApi = options.catalogueApi || (await new CatalogueApi());
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
      async ({ siret_responsable, email_responsable, uai_formateurs }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return;
        }

        try {
          const found = await Etablissement.findOne({ siret: siret_responsable }).lean();
          const formateurs = await buildEtablissements(uai_formateurs, found ?? { siret: siret_responsable });
          let organisme;

          if (!found) {
            organisme = await catalogueApi
              .getEtablissement({ siret: siret_responsable, published: true })
              .catch((error) => {
                logger.warn(error, `Le responsable ${siret_responsable} n'est pas dans le catalogue`);

                return null;
              });

            if (!organisme) {
              stats.failed++;
              logger.error(`Le responsable ${siret_responsable} n'est pas dans le catalogue`);
              return;
            }
          }

          if (!found?.uai && !organisme?.uai) {
            stats.failed++;
            logger.error(`Le responsable ${siret_responsable} n'a pas d'UAI dans le catalogue`);
            return;
          }

          if (formateurs.length === 0) {
            stats.failed++;
            logger.error(`Le responsable ${siret_responsable} / ${organisme?.uai} n'a aucun établissement formateur`);
            return;
          }

          // const updates = omitEmpty({
          //   uai: organisme?.uai ?? found?.uai,
          //   etablissements_formateur: formateurs,
          //   raison_sociale: organisme?.raison_sociale ?? found?.raison_sociale,
          //   academie: pick(findAcademieByUai(organisme?.uai ?? found?.uai), ["code", "nom"]),
          //   adresse: organisme?.adresse?.label ?? found?.adresse,
          //   libelle_ville: organisme?.adresse?.localite ?? found?.libelle_ville,
          // });

          const updates = omitEmpty({
            etablissements_formateur: formateurs,
            uai: organisme?.uai ?? found?.uai,
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
            academie: pick(findAcademieByUai(organisme?.uai ?? found?.uai), ["code", "nom"]),
          });

          const res = await Etablissement.updateOne(
            { siret: siret_responsable },
            {
              $setOnInsert: {
                siret: siret_responsable,
                username: siret_responsable,
                email: email_responsable,
              },
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Responsable ${siret_responsable} / ${organisme?.uai ?? found?.uai} ajouté`);
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
              `Responsable ${siret_responsable} / ${organisme?.uai ?? found?.uai} mis à jour \n${JSON.stringify(
                diff(previous, updates),
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Responsable ${siret_responsable} / ${organisme?.uai ?? found?.uai} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter le responsable ${siret_responsable}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importEtablissementsResponsables;
