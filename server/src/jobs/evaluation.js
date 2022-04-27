const logger = require("../common/logger");
const { transformData, compose } = require("oleoduc");
const CatalogueApi = require("../common/api/CatalogueApi");
const { Cfa } = require("../common/model");
const ReferentielApi = require("../common/api/ReferentielApi");

function evaluate() {
  let catalogueApi = new CatalogueApi();
  let referentielApi = new ReferentielApi();

  return compose(
    Cfa.find().cursor(),
    transformData(
      async (cfa) => {
        let siret = cfa.siret;

        let [organisme, { formations: formationsEnTantQueGestionnaire }] = await Promise.all([
          referentielApi
            .getOrganisme(siret, {
              champs: "nature,relations",
            })
            .catch(() => null),
          catalogueApi.getFormations(
            {
              published: true,
              $or: [{ etablissement_gestionnaire_uai: cfa.uai }, { etablissement_gestionnaire_siret: cfa.siret }],
            },
            {
              limit: 250,
              select: {
                etablissement_gestionnaire_uai: 1,
                etablissement_gestionnaire_siret: 1,
              },
            }
          ),
        ]);

        if (formationsEnTantQueGestionnaire.length > 0) {
          logger.info(`Le CFA ${cfa.uai} est responsable`);
          return;
        }

        let gestionnaires = organisme?.relations
          .filter((r) => r.type === "formateur->responsable")
          .map((r) => r.siret)
          .join(", ");

        return {
          uai: cfa.uai,
          siret,
          raison_sociale: cfa.raison_sociale,
          gestionnaires: gestionnaires,
        };
      },
      { parallel: 10 }
    )
  );
}

module.exports = evaluate;
