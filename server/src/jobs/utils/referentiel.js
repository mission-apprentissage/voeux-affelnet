const ReferentielApi = require("../../common/api/ReferentielApi.js");
const logger = require("../../common/logger.js");

const referentiel = async () => {
  const referentielApi = new ReferentielApi();

  const findEmailReferentielCache = new Map();
  const findSiretResponsableReferentiel = new Map();

  return {
    findEmailReferentiel: async (siret) => {
      if (!siret || !siret?.length) {
        return null;
      }
      if (findEmailReferentielCache.has(siret)) {
        return findEmailReferentielCache.get(siret);
      }

      try {
        const result = await (async () => {
          let organisme = await referentielApi.getOrganisme(siret);

          return organisme?.contacts.find((c) => c.confirmé === true)?.email || organisme?.contacts[0]?.email;
        })();

        findEmailReferentielCache.set(siret, result);
        return result;
      } catch (e) {
        logger.error(e, `Une erreur est survenue lors de l'appel au référentiel pour le siret ${siret}`);
        return null;
      }
    },

    findSiretResponsableReferentiel: async (uai) => {
      if (!uai || !uai?.length) {
        return null;
      }
      if (findSiretResponsableReferentiel.has(uai)) {
        return findSiretResponsableReferentiel.get(uai);
      }

      try {
        const result = await (async () => {
          let { organismes } = await referentielApi.searchOrganismes({ uais: uai });

          if (organismes.length === 0) {
            logger.warn(`Impossible de trouver l'organisme ${uai} dans le référentiel`);
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

        findSiretResponsableReferentiel.set(uai, result);

        return result;
      } catch (e) {
        logger.error(e, `Une erreur est survenue lors de l'appel au référentiel pour l'UAI ${uai}`);
        return null;
      }
    },
  };
};

module.exports = { referentiel };
