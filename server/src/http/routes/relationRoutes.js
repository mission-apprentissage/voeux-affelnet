const Boom = require("boom");
const express = require("express");
const Joi = require("@hapi/joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Responsable, Formateur } = require("../../common/model");

module.exports = () => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.get(
    "/api/relation/rechercheResponsable",
    tryCatch(async (req, res) => {
      const { search } = await Joi.object({
        search: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      const regex = ".*" + search + ".*";
      const regexQuery = { $regex: regex, $options: "i" };

      const responsable = await Responsable.findOne(
        { $or: [{ siret: regexQuery }, { uai: regexQuery }, { raison_sociale: regexQuery }] },
        { _id: 0 }
      )
        .sort({ raison_sociale: 1 })
        .lean();

      if (!responsable) {
        throw Boom.notFound(`Aucun organisme responsable trouvé pour la recherche "${search}"`);
      }

      const formateurs = await Formateur.find(
        { uai: { $in: responsable.etablissements_formateur.map((etablissement) => etablissement.uai) } },
        { _id: 0 }
      );

      if (!formateurs.length) {
        throw Boom.notFound(`Aucun organisme formateur trouvé pour cet établissement.`);
      }

      return res.json({
        responsable,
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

      const responsables =
        (await Responsable.find(
          { siret: { $in: formateur.etablissements_responsable.map((etablissement) => etablissement.siret) } },
          { _id: 0 }
        )
          .sort({ raison_sociale: 1 })
          .lean()) ?? [];

      if (!responsables.length) {
        throw Boom.notFound(`Aucun organisme responsable trouvé pour cet établissement.`);
      }

      return res.json({ responsables, formateur });
    })
  );

  return router;
};
