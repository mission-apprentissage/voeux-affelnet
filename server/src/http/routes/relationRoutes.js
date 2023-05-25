const Boom = require("boom");
const express = require("express");
const Joi = require("@hapi/joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Gestionnaire, Formateur } = require("../../common/model");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.get(
    "/api/relation/rechercheGestionnaire",
    tryCatch(async (req, res) => {
      const { search } = await Joi.object({
        search: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      const regex = ".*" + search + ".*";
      const regexQuery = { $regex: regex, $options: "i" };

      const gestionnaire = await Gestionnaire.findOne(
        { $or: [{ siret: regexQuery }, { uai: regexQuery }, { raison_sociale: regexQuery }] },
        { _id: 0 }
      )
        .sort({ raison_sociale: 1 })
        .lean();

      if (!gestionnaire) {
        throw Boom.notFound(`Aucun organisme responsable trouvé pour la recherche "${search}"`);
      }

      const formateurs = await Formateur.find(
        { uai: { $in: gestionnaire.etablissements.map((etablissement) => etablissement.uai) } },
        { _id: 0 }
      );

      if (!formateurs.length) {
        throw Boom.notFound(`Aucun organisme formateur trouvé pour cet établissement.`);
      }

      return res.json({
        gestionnaire,
        formateurs,
      });
    })
  );

  router.get(
    "/api/relation/rechercheFormateur",
    tryCatch(async (req, res) => {
      const { search } = await Joi.object({
        search: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      const regex = ".*" + search + ".*";
      const regexQuery = { $regex: regex, $options: "i" };

      const formateur = await Formateur.findOne(
        { $or: [{ siret: regexQuery }, { uai: regexQuery }, { raison_sociale: regexQuery }] },
        { _id: 0 }
      );

      if (!formateur) {
        throw Boom.notFound(`Aucun organisme formateur trouvé pour la recherche "${search}"`);
      }

      const gestionnaires =
        (await Gestionnaire.find(
          { siret: { $in: formateur.etablissements.map((etablissement) => etablissement.siret) } },
          { _id: 0 }
        )
          .sort({ raison_sociale: 1 })
          .lean()) ?? [];

      if (!gestionnaires.length) {
        throw Boom.notFound(`Aucun organisme responsable trouvé pour cet établissement.`);
      }

      return res.json({ gestionnaires, formateur });
    })
  );

  return router;
};
