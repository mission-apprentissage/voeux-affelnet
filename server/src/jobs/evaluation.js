const logger = require("../common/logger");
const { transformData, compose } = require("oleoduc");
const CatalogueApi = require("../common/api/CatalogueApi");
const { Cfa } = require("../common/model");

function evaluate() {
  let catalogueApi = new CatalogueApi();

  return compose(
    Cfa.find({ statut: "activé" }).cursor(),
    transformData(
      async (cfa) => {
        let siret = cfa.siret;

        let formationsEnTantQueGestionnaire = await catalogueApi.getFormations(
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
        );

        if (formationsEnTantQueGestionnaire.length === 0) {
          logger.info(`Le CFA ${cfa.uai} est formateur`);
          return;
        }

        return {
          uai: cfa.uai,
          siret,
          raison_sociale: cfa.raison_sociale,
          email: cfa.email,
        };
      },
      { parallel: 10 }
    )
  );
}

module.exports = evaluate;
