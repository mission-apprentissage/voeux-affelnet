const CatalogueApi = require("../../common/api/CatalogueApi.js");
const logger = require("../../common/logger.js");

const catalogue = async () => {
  const catalogueApi = new CatalogueApi();

  await catalogueApi.connect();

  const findFormateurUaiCache = new Map();
  const findResponsablleSiretAndEmailCache = new Map();

  return {
    findFormateurUai: async ({ uai, cle_ministere_educatif, siret_responsable }) => {
      const key = JSON.stringify({ uai, siret_responsable, cle_ministere_educatif });

      if (findFormateurUaiCache.has(key)) {
        return findFormateurUaiCache.get(key);
      }

      try {
        const { formations } = await catalogueApi.getFormations(
          {
            published: true,
            ...(cle_ministere_educatif ? { cle_ministere_educatif: cle_ministere_educatif } : {}),
            ...(siret_responsable ? { etablissement_gestionnaire_siret: siret_responsable } : {}),
            uai_formation: uai,
            affelnet_published_date: { $ne: null },

            // ...(cle_ministere_educatif
            //   ? { cle_ministere_educatif: cle_ministere_educatif }
            //   : {
            //       published: true,
            //       affelnet_published_date: { $ne: null },
            //       ...(siret_responsable ? { etablissement_gestionnaire_siret: siret_responsable } : {}),
            //       uai_formation: uai,
            //     }),
          },
          {
            limit: 100,
            select: {
              etablissement_formateur_uai: 1,
            },
          }
        );

        const alternatives = {
          // WARNING: This is not a drop in replacement solution and
          // it might not work for some edge cases. Test your code!
          uais: [...new Set(formations.map((f) => f.etablissement_formateur_uai))].filter((uai) => !!uai),
        };

        findFormateurUaiCache.set(key, {
          formations,
          alternatives,
        });

        return { formations, alternatives };
      } catch (e) {
        logger.error(
          e,
          `Une erreur est survenue lors de l'appel au catalogue pour les valeurs ${uai} /
        ${cle_ministere_educatif} /
        ${siret_responsable}`
        );
        return null;
      }
    },

    findResponsableSiretAndEmail: async ({ uai_formateur, cle_ministere_educatif, siret_responsable }) => {
      const key = JSON.stringify({ uai_formateur, siret_responsable });

      if (findResponsablleSiretAndEmailCache.has(key)) {
        return findResponsablleSiretAndEmailCache.get(key);
      }

      try {
        const { formations } = await catalogueApi.getFormations(
          {
            published: true,
            ...(cle_ministere_educatif ? { cle_ministere_educatif: cle_ministere_educatif } : {}),
            ...(siret_responsable ? { etablissement_gestionnaire_siret: siret_responsable } : {}),
            $or: [{ etablissement_formateur_uai: uai_formateur, affelnet_published_date: { $ne: null } }],
          },
          {
            limit: 100,
            select: {
              etablissement_gestionnaire_courriel: 1,
              etablissement_gestionnaire_siret: 1,
            },
          }
        );

        const alternatives = {
          sirets: [...new Set(formations.map((f) => f.etablissement_gestionnaire_siret))].filter((siret) => !!siret),
          emails: [...new Set(formations.flatMap((f) => f.etablissement_gestionnaire_courriel?.split("##")))].filter(
            (email) => !!email
          ),
        };

        findResponsablleSiretAndEmailCache.set(JSON.stringify(key), {
          formations,
          alternatives,
        });

        return { formations, alternatives };
      } catch (e) {
        logger.error(
          e,
          `Une erreur est survenue lors de l'appel au catalogue pour les valeurs ${uai_formateur} /
        ${cle_ministere_educatif} /
        ${siret_responsable}`
        );
        return null;
      }
    },
  };
};

module.exports = { catalogue };
