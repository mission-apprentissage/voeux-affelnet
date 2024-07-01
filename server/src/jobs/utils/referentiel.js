const ReferentielApi = require("../../common/api/ReferentielApi.js");
const logger = require("../../common/logger.js");

const referentiel = async () => {
  const referentielApi = new ReferentielApi();

  const findEmailCache = new Map();
  const findSiretResponsableCache = new Map();

  return {
    findEmail: async (siret) => {
      logger.debug(`referentiel > findEmail ${siret}`);

      if (!siret || !siret?.length) {
        return null;
      }
      if (findEmailCache.has(siret)) {
        return findEmailCache.get(siret);
      }

      try {
        const result = await (async () => {
          let organisme = await referentielApi.getOrganisme(siret);

          return organisme?.contacts.find((c) => c.confirmé === true)?.email || organisme?.contacts[0]?.email;
        })();

        findEmailCache.set(siret, result);
        return result;
      } catch (e) {
        logger.error(e, `referentiel > findEmail / Une erreur est survenue lors de l'appel pour le siret ${siret}`);
        return null;
      }
    },

    findSiretResponsable: async (uai) => {
      logger.debug(`referentiel > findSiretResponsable ${uai}`);

      if (!uai || !uai?.length) {
        return null;
      }

      if (findSiretResponsableCache.has(uai)) {
        return findSiretResponsableCache.get(uai);
      }

      try {
        const result = await (async () => {
          let { organismes } = await referentielApi.searchOrganismes({ uais: uai });

          if (organismes.length === 0) {
            logger.warn(`referentiel > findSiretResponsable : Impossible de trouver l'organisme ${uai}`);
            return null;
          }

          const responsable = organismes.find((o) => o.nature !== "formateur");
          if (!responsable) {
            return organismes
              .flatMap((o) => o.relations)
              .filter((r) => r.type === "formateur->responsable")
              .map((r) => r.siret)[0];
          }

          return responsable.siret;
        })();

        findSiretResponsableCache.set(uai, result);

        return result;
      } catch (e) {
        logger.error(
          e,
          `referentiel > findSiretResponsable : Une erreur est survenue lors de l'appel au référentiel pour l'UAI ${uai}`
        );
        return null;
      }
    },
  };
};

module.exports = { referentiel };
