const { Delegue, Relation } = require("../common/model");
const logger = require("../common/logger");

async function activateDelegues(options) {
  const proceed = typeof options.proceed !== "undefined" ? options.proceed : true;

  const existingRelations = await Relation.find({});

  const stats = {
    activated: 0,
  };

  for await (const existingRelation of existingRelations) {
    if (proceed) {
      const { modifiedCount } = await Delegue.updateMany(
        {
          relations: {
            $elemMatch: {
              "etablissement_responsable.siret": existingRelation.etablissement_responsable?.siret,
              "etablissement_formateur.siret": existingRelation.etablissement_formateur?.siret,
              active: false,
            },
          },
        },
        {
          $set: {
            "relations.$.active": true,
          },
        }
      );

      if (modifiedCount > 0) {
        logger.warn(
          `[DONE] Activation de la délégation ${existingRelation.etablissement_responsable?.siret} / ${existingRelation.etablissement_formateur?.siret} pour ${modifiedCount} délégué(s)`
        );
        stats.activated += modifiedCount;
      }
    } else {
      const modifiedCount = await Delegue.countDocuments({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": existingRelation.etablissement_responsable?.siret,
            "etablissement_formateur.siret": existingRelation.etablissement_formateur?.siret,
            active: false,
          },
        },
      });

      if (modifiedCount > 0) {
        logger.warn(
          `[TODO] Activation de la délégation ${existingRelation.etablissement_responsable?.siret} / ${existingRelation.etablissement_formateur?.siret} pour ${modifiedCount} délégué(s)`
        );
        stats.activated += modifiedCount;
      }

      if (modifiedCount > 1) {
        const delegueEmails = (
          await await Delegue.find({
            relations: {
              $elemMatch: {
                "etablissement_responsable.siret": existingRelation.etablissement_responsable?.siret,
                "etablissement_formateur.siret": existingRelation.etablissement_formateur?.siret,
                active: false,
              },
            },
          })
        ).map((delegue) => delegue.email);

        logger.error(
          `[TODO] ${modifiedCount} délégués à activer pour ${existingRelation.etablissement_responsable?.siret} / ${
            existingRelation.etablissement_formateur?.siret
          } : ${delegueEmails.join(", ")}`
        );
      }
    }
  }

  if (!proceed) {
    logger.warn(`TO PROCEED USE --proceed OPTION`);
  }

  return stats;
}

module.exports = { activateDelegues };
