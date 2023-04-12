const express = require("express");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { markVoeuxAsDownloadedByFormateur } = require("../../common/actions/markVoeuxAsDownloaded");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Gestionnaire, Formateur, Voeu } = require("../../common/model");
const { siretFormat } = require("../../common/utils/format");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  /**
   * Retourne le gestionnaire connecté
   */
  router.get(
    "/api/formateur",
    checkApiToken(),
    ensureIs("Formateur"),
    tryCatch(async (req, res) => {
      const { uai } = req.user;
      const formateur = await Formateur.findOne({ uai }).lean();

      formateur.etablissements = await Promise.all(
        formateur.etablissements?.map(async (etablissement) => {
          const voeuxFilter = {
            "etablissement_accueil.uai": uai,
            "etablissement_gestionnaire.siret": etablissement.siret,
          };
          const voeux = await Voeu.find(voeuxFilter);

          return {
            ...etablissement,

            diffusionAutorisee: (await Gestionnaire.findOne({ siret: etablissement.siret }))?.etablissements?.find(
              (etablissement) => etablissement.uai === uai
            )?.diffusionAutorisee,

            nombre_voeux: etablissement.siret ? await Voeu.countDocuments(voeuxFilter).lean() : 0,

            first_date_voeux: etablissement.siret
              ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
              : null,

            last_date_voeux: etablissement.siret
              ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
              : null,
          };
        })
      );

      res.json(formateur);
    })
  );

  router.put(
    "/api/formateur",
    checkApiToken(),
    ensureIs("Formateur"),
    tryCatch(async (req, res) => {
      const { uai } = req.user;

      await Formateur.updateOne(
        { uai },
        {
          $set: {
            ...(typeof req.body.email !== "undefined" ? { email: req.body.email } : {}),
          },
        }
      );

      const updatedFormateur = await Formateur.findOne({ uai });

      res.json(updatedFormateur);
    })
  );

  /**
   * Retourne la liste des gestionnaires associés au formateur connecté
   */
  router.get(
    "/api/formateur/gestionnaires",
    checkApiToken(),
    ensureIs("Formateur"),
    tryCatch(async (req, res) => {
      const { uai } = req.user;
      const formateur = await Formateur.findOne({ uai }).lean();

      if (!formateur.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          formateur.etablissements.map(async (etablissement) => {
            return await Gestionnaire.findOne({ siret: etablissement.siret }).lean();
          })
        )
      );
    })
  );

  /**
   * Retourne la liste des voeux pour le formateur connecté sous forme d'un CSV.
   */
  router.get(
    // "/api/formateur/voeux",
    "/api/formateur/gestionnaires/:siret/voeux",
    checkApiToken(),
    ensureIs("Formateur"),
    tryCatch(async (req, res) => {
      const { uai } = req.user;
      const formateur = await Formateur.findOne({ uai });
      const filename = `${uai}.csv`;

      const { siret } = await Joi.object({
        uai: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      // TODO : filtrer sur les délégation autorisées.

      await Promise.all(
        formateur.etablissements?.map(
          async (etablissement) => await markVoeuxAsDownloadedByFormateur(etablissement.siret, uai)
        )
      );

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream({ siret, uai }), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  return router;
};
