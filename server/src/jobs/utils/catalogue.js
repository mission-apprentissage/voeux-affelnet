const { uniq } = require("lodash");
const CatalogueApi = require("../../common/api/CatalogueApi.js");
const logger = require("../../common/logger.js");

const catalogue = async () => {
  const catalogueApi = new CatalogueApi();

  await catalogueApi.connect();

  const findFormateurUaiCache = new Map();
  const findGestionnaireSiretAndEmailCache = new Map();

  return {
    findFormateurUai: async ({ uai, cleMinistereEducatif, siretGestionnaire }) => {
      const key = JSON.stringify({ uai, siretGestionnaire, cleMinistereEducatif });

      if (findFormateurUaiCache.has(key)) {
        return findFormateurUaiCache.get(key);
      }

      try {
        const { formations } = await catalogueApi.getFormations(
          {
            ...(cleMinistereEducatif
              ? { cle_ministere_educatif: cleMinistereEducatif }
              : {
                  published: true,
                  affelnet_published_date: { $ne: null },
                  ...(siretGestionnaire ? { etablissement_gestionnaire_siret: siretGestionnaire } : {}),
                  uai_formation: uai,
                }),
          },
          {
            limit: 100,
            select: {
              etablissement_formateur_uai: 1,
            },
          }
        );

        const alternatives = {
          uais: uniq(formations.map((f) => f.etablissement_formateur_uai)).filter((uai) => !!uai),
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
        ${cleMinistereEducatif} /
        ${siretGestionnaire}`
        );
        return null;
      }
    },

    findGestionnaireSiretAndEmail: async ({ uai, cleMinistereEducatif, siretGestionnaire }) => {
      const key = JSON.stringify({ uai, siretGestionnaire });

      if (findGestionnaireSiretAndEmailCache.has(key)) {
        return findGestionnaireSiretAndEmailCache.get(key);
      }

      try {
        const { formations } = await catalogueApi.getFormations(
          {
            published: true,
            ...(cleMinistereEducatif ? { cle_ministere_educatif: cleMinistereEducatif } : {}),
            ...(siretGestionnaire ? { etablissement_gestionnaire_siret: siretGestionnaire } : {}),
            $or: [{ etablissement_formateur_uai: uai, affelnet_published_date: { $ne: null } }],
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
          sirets: uniq(formations.map((f) => f.etablissement_gestionnaire_siret)).filter((siret) => !!siret),
          emails: uniq(formations.flatMap((f) => f.etablissement_gestionnaire_courriel?.split("##"))).filter(
            (email) => !!email
          ),
        };

        findGestionnaireSiretAndEmailCache.set(JSON.stringify(key), {
          formations,
          alternatives,
        });

        return { formations, alternatives };
      } catch (e) {
        logger.error(
          e,
          `Une erreur est survenue lors de l'appel au catalogue pour les valeurs ${uai} /
        ${cleMinistereEducatif} /
        ${siretGestionnaire}`
        );
        return null;
      }
    },
  };
};

module.exports = { catalogue };
