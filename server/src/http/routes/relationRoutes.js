const Boom = require("boom");
const express = require("express");
const Joi = require("@hapi/joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Cfa, Ufa } = require("../../common/model");
const ReferentielApi = require("../../common/api/ReferentielApi");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap
  const referentielApi = new ReferentielApi();

  router.get(
    "/api/relation/rechercheGestionnaire",
    tryCatch(async (req, res) => {
      const { search } = await Joi.object({
        search: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      const cfas = await Cfa.find({ $or: [{ siret: search }, { raison_sociale: search }] }, { _id: 0 })
        .sort({ raison_sociale: 1 })
        .lean();

      if (!cfas.length) {
        throw Boom.notFound(`Aucun établissement trouvé pour la recherche "${search}"`);
      }

      const results = await Promise.all(
        cfas?.map(async (cfa) => {
          let gestionnaire;
          const defaultGestionnaire = cfa; // { siret: cfa.siret, email: cfa.email, statut: cfa.statut };
          try {
            gestionnaire = { ...defaultGestionnaire, ...(await referentielApi.getOrganisme(cfa.siret)) };
          } catch (error) {
            console.error(error);
            gestionnaire = defaultGestionnaire;
          }

          const formateurs = await Promise.all(
            cfa?.etablissements?.map(async (etablissement) => {
              let formateur;
              const defaultFormateur = { uai: etablissement.uai };
              try {
                formateur = (await Ufa.findOne({ uai: etablissement.uai })) ?? defaultFormateur;
              } catch (error) {
                console.error(error);
                formateur = defaultFormateur;
              }
              return formateur;
            }) ?? []
          );

          return {
            gestionnaire,
            formateurs,
          };
        }) ?? []
      );

      return res.json({ results });
    })
  );

  router.get(
    "/api/relation/rechercheFormateur",
    tryCatch(async (req, res) => {
      const { search } = await Joi.object({
        search: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      const ufa = await Ufa.findOne({ $or: [{ uai: search }, { libelle_etablissement: search }] }, { _id: 0 });

      if (!ufa) {
        throw Boom.notFound(`Aucun établissement trouvé pour la recherche "${search}"`);
      }

      const cfas = await Cfa.find({ "etablissements.uai": ufa.uai }, { _id: 0 }).sort({ raison_sociale: 1 }).lean();

      if (!cfas.length) {
        throw Boom.notFound(`Aucun organisme gestionnaire trouvé pour cet établissement.`);
      }

      const results = await Promise.all(
        cfas?.map(async (cfa) => {
          let gestionnaire;
          const defaultGestionnaire = cfa; // { siret: cfa.siret, email: cfa.email, statut: cfa.statut };
          try {
            gestionnaire = { ...defaultGestionnaire, ...(await referentielApi.getOrganisme(cfa.siret)) };
          } catch (error) {
            console.error(error);
            gestionnaire = defaultGestionnaire;
          }

          const formateur = ufa;

          return {
            gestionnaire,
            formateur,
          };
        }) ?? []
      );

      return res.json({ results });
    })
  );

  return router;
};
