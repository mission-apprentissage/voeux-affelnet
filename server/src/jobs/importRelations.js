const { oleoduc, filterData, writeData, accumulateData, flattenArray } = require("oleoduc");
const Joi = require("@hapi/joi");
const { pick } = require("lodash");
const { diff } = require("deep-object-diff");

const { Formateur, Responsable, Relation } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { siretFormat, uaiFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");
const {
  getNombreVoeux,
  getFirstVoeuxDate,
  getLastVoeuxDate,
  getNombreVoeuxRestant,
} = require("../common/utils/voeuxUtils");
const { findAcademieByUai } = require("../common/academies");
const { getCsvContent } = require("./utils/csv");

const SIRET_RECENSEMENT = "99999999999999";

const schema = Joi.object({
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  uai_formateurs: arrayOf(Joi.string().pattern(uaiFormat)).required(),
}).unknown();

async function importRelations(relationsCsv, responsableOverwriteCsv, formateurOverwriteCsv) {
  const responsableOverwriteArray = await getCsvContent(responsableOverwriteCsv);
  const formateurOverwriteArray = await getCsvContent(formateurOverwriteCsv);

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
    removed: 0,
  };

  const relations = [];

  await oleoduc(
    relationsCsv,
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
      logger.warn(`La relation ${json.siret} / ${json.uai} est invalide`, error);
      return false;
    }),
    accumulateData(
      async (accumulator, { siret_responsable, uai_formateurs }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return accumulator;
        }

        uai_formateurs.split(",").forEach((uai_formateur) => {
          accumulator.push({ uai_formateur, siret_responsable });
        });

        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    writeData(
      async ({ uai_formateur, siret_responsable }) => {
        if (!uai_formateur?.length || !siret_responsable?.length) {
          throw new Error(`uai_formateur ou siret_responsable invalide`);
        }

        relations.push({ uai_formateur, siret_responsable });

        try {
          const responsableOverwrite = responsableOverwriteArray.find(
            (record) => record["Siret"] === siret_responsable
          );
          const formateurOverwrite = formateurOverwriteArray.find((record) => record["UAI"] === uai_formateur);

          const found = await Relation.findOne({
            "etablissement_formateur.uai": uai_formateur,
            "etablissement_responsable.siret": siret_responsable,
          }).lean();
          const formateur = await Formateur.findOne({ uai: uai_formateur }).lean();
          const responsable = await Responsable.findOne({ siret: siret_responsable }).lean();

          const updates = {
            etablissement_formateur: {
              uai: uai_formateur,
              siret: formateurOverwrite?.Siret ?? formateur?.siret,
            },
            etablissement_responsable: {
              uai: responsableOverwrite?.UAI ?? responsable?.uai,
              siret: siret_responsable,
            },
            first_date_voeux: await getFirstVoeuxDate({ uai: uai_formateur, siret: siret_responsable }),
            last_date_voeux: await getLastVoeuxDate({ uai: uai_formateur, siret: siret_responsable }),
            nombre_voeux: await getNombreVoeux({ uai: uai_formateur, siret: siret_responsable }),
            nombre_voeux_restant: await getNombreVoeuxRestant({ uai: uai_formateur, siret: siret_responsable }),
            academie: pick(findAcademieByUai(uai_formateur), ["code", "nom"]),
          };

          const res = await Relation.updateOne(
            { "etablissement_formateur.uai": uai_formateur, "etablissement_responsable.siret": siret_responsable },
            {
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Relation ${siret_responsable} / ${uai_formateur} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, [
              "etablissement_responsable",
              "etablissement_formateur",
              "first_date_voeux",
              "last_date_voeux",
              "nombre_voeux",
              "academie",
            ]);

            logger.info(
              `Relation ${siret_responsable} / ${uai_formateur} mis à jour \n${JSON.stringify(
                diff(previous, updates),
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Relation ${siret_responsable} / ${uai_formateur} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter la relation ${siret_responsable} / ${uai_formateur}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  const existingRelations = await Relation.find({});

  for await (const existingRelation of existingRelations) {
    if (
      !relations.find(
        (relation) =>
          relation.uai_formateur === existingRelation.etablissement_formateur?.uai &&
          relation.siret_responsable === existingRelation.etablissement_responsable?.siret
      )
    ) {
      logger.warn(
        `La relation ${existingRelation.etablissement_responsable?.siret} / ${existingRelation.etablissement_formateur?.uai} n'est plus présente dans le fichier d'import`
      );
      await Relation.deleteOne({ _id: existingRelation._id });
      stats.removed++;
    }
  }

  return stats;
}

module.exports = importRelations;
