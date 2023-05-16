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
      if (findFormateurUaiCache.has(JSON.stringify({ uai }))) {
        return findFormateurUaiCache.get(JSON.stringify({ uai }));
      }

      try {
        const { formations } = await catalogueApi.getFormations(
          {
            published: true,
            ...(cleMinistereEducatif ? { cle_ministere_educatif: cleMinistereEducatif } : {}),
            ...(siretGestionnaire ? { etablissement_gestionnaire_siret: siretGestionnaire } : {}),
            uai_formation: uai,
            affelnet_published_date: { $ne: null },
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

        findFormateurUaiCache.set(JSON.stringify({ uai }), { formations, alternatives });

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
      if (findGestionnaireSiretAndEmailCache.has(JSON.stringify({ uai, siretGestionnaire }))) {
        return findGestionnaireSiretAndEmailCache.get(JSON.stringify({ uai, siretGestionnaire }));
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

        findGestionnaireSiretAndEmailCache.set(JSON.stringify({ uai, siretGestionnaire }), {
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
