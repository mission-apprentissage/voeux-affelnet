const { oleoduc, filterData, writeData, accumulateData, flattenArray } = require("oleoduc");
const Joi = require("@hapi/joi");
const { pick } = require("lodash");
const { diff } = require("deep-object-diff");

const { Relation, Etablissement, Delegue } = require("../common/model");
const logger = require("../common/logger");
const { arrayOf } = require("../common/validators");
const { parseCsv } = require("../common/utils/csvUtils");
const { siretFormat } = require("../common/utils/format");
const { omitEmpty } = require("../common/utils/objectUtils");
const {
  getNombreVoeux,
  getFirstVoeuxDate,
  getLastVoeuxDate,
  getNombreVoeuxRestant,
} = require("../common/utils/voeuxUtils");
const { findAcademieByUai } = require("../common/academies");
// const { getCsvContent } = require("./utils/csv");

const SIRET_RECENSEMENT = "99999999999999";
// const UAI_RECENSEMENT = "0000000A";

const schema = Joi.object({
  siret_responsable: Joi.string().pattern(siretFormat).required(),
  siret_formateurs: arrayOf(Joi.string().pattern(siretFormat)).required(),
}).unknown();

async function importEtablissementsRelations(relationsCsv /*, responsableOverwriteCsv, formateurOverwriteCsv*/) {
  // const responsableOverwriteArray = await getCsvContent(responsableOverwriteCsv);
  // const formateurOverwriteArray = await getCsvContent(formateurOverwriteCsv);
  const existingRelations = await Relation.find({});

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
      logger.warn(`La relation ${json.siret_responsable} / ${json.siret_formateurs} est invalide`, error);
      return false;
    }),
    accumulateData(
      async (accumulator, { siret_responsable, siret_formateurs }) => {
        if (siret_responsable === SIRET_RECENSEMENT) {
          return accumulator;
        }

        siret_formateurs.split(",").forEach((siret_formateur) => {
          accumulator.push({ siret_formateur, siret_responsable });
        });

        return accumulator;
      },
      { accumulator: [] }
    ),
    flattenArray(),
    writeData(
      async ({ siret_responsable, siret_formateur }) => {
        if (!siret_responsable?.length || !siret_formateur?.length) {
          throw new Error(` siret_responsable ou siret_formateur invalide`);
        }

        relations.push({ siret_responsable, siret_formateur });

        try {
          // const responsableOverwrite = responsableOverwriteArray.find((record) => record["SIRET"] === siret_responsable);
          // const formateurOverwrite = formateurOverwqriteArray.find((record) => record["SIRET"] === siret_formateur);

          const found = await Relation.findOne({
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
          }).lean();
          const formateur = await Etablissement.findOne({ siret: siret_formateur }).lean();
          // const responsable = await Responsable.findOne({ siret: siret_responsable }).lean();

          const updates = {
            etablissement_responsable: {
              siret: siret_responsable,
              // siret: responsableOverwrite?.SIRET ?? responsable?.siret,
            },
            etablissement_formateur: {
              siret: siret_formateur,
              // siret: formateurOverwrite?.Siret ?? formateur?.siret,
            },
            first_date_voeux: await getFirstVoeuxDate({ siret_formateur, siret_responsable }),
            last_date_voeux: await getLastVoeuxDate({ siret_formateur, siret_responsable }),
            nombre_voeux: await getNombreVoeux({ siret_formateur, siret_responsable }),
            nombre_voeux_restant: await getNombreVoeuxRestant({ siret_formateur, siret_responsable }),
            academie: formateur?.uai
              ? pick(findAcademieByUai(formateur?.uai), ["code", "nom"])
              : { code: "??", nom: "N/A" },
          };

          const res = await Relation.updateOne(
            {
              "etablissement_responsable.siret": siret_responsable,
              "etablissement_formateur.siret": siret_formateur,
            },
            {
              $set: updates,
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Relation ${siret_responsable} / ${siret_formateur} ajouté`);
          } else if (res.modifiedCount) {
            stats.updated++;

            const previous = pick(found, [
              "etablissement_responsable",
              "etablissement_formateur",
              "first_date_voeux",
              "last_date_voeux",
              "nombre_voeux",
              "nombre_voeux_restant",
              "academie",
            ]);

            logger.info(
              `Relation ${siret_responsable} / ${siret_formateur} mis à jour \n${JSON.stringify(
                diff(previous, updates),
                null,
                2
              )}`
            );
          } else {
            logger.trace(`Relation ${siret_responsable} / ${siret_formateur} déjà à jour`);
          }
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter la relation ${siret_responsable} / ${siret_formateur}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  for await (const existingRelation of existingRelations) {
    if (
      !relations.find(
        (relation) =>
          relation.siret_responsable === existingRelation.etablissement_responsable?.siret &&
          relation.siret_formateur === existingRelation.etablissement_formateur?.siret
      )
    ) {
      logger.warn(
        `La relation ${existingRelation.etablissement_responsable?.siret} / ${existingRelation.etablissement_formateur?.siret} n'est plus présente dans le fichier d'import`
      );
      await Relation.deleteOne({ _id: existingRelation._id });

      const { modifiedCount } = await Delegue.updateMany(
        {
          relations: {
            $elemMatch: {
              "etablissement_responsable.siret": existingRelation.etablissement_responsable?.siret,
              "etablissement_formateur.siret": existingRelation.etablissement_formateur?.siret,
            },
          },
        },
        {
          $pull: {
            relations: {
              "etablissement_responsable.siret": existingRelation.etablissement_responsable?.siret,
              "etablissement_formateur.siret": existingRelation.etablissement_formateur?.siret,
            },
          },
        }
      );

      if (modifiedCount > 0) {
        logger.warn(
          `Suppression de la relation ${existingRelation.etablissement_responsable?.siret} / ${existingRelation.etablissement_formateur?.siret} pour ${modifiedCount} délégué(s)`
        );
      }

      stats.removed++;
    }
  }

  return stats;
}

module.exports = { importEtablissementsRelations };
