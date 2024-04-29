const express = require("express");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { markVoeuxAsDownloadedByFormateur } = require("../../common/actions/markVoeuxAsDownloaded");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Responsable, Formateur, Voeu } = require("../../common/model");
const { siretFormat } = require("../../common/utils/format");
const { changeEmail } = require("../../common/actions/changeEmail");
const { UserType } = require("../../common/constants/UserType.js");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  /**
   * Retourne le formateur connecté
   */
  router.get(
    "/api/formateur",
    checkApiToken(),
    ensureIs(UserType.FORMATEUR),
    tryCatch(async (req, res) => {
      const { uai } = req.user;
      const formateur = await Formateur.findOne({ uai }).lean();

      res.json({
        ...formateur,

        nombre_voeux: await Voeu.countDocuments({ "etablissement_formateur.uai": uai }),

        etablissements: await Promise.all(
          formateur?.etablissements_responsable?.map(async (etablissement) => {
            const voeuxFilter = {
              "etablissement_formateur.uai": uai,
              "etablissement_responsable.siret": etablissement.siret,
            };
            const voeux = await Voeu.find(voeuxFilter);

            return {
              ...etablissement,

              diffusion_autorisee: (
                await Responsable.findOne({ siret: etablissement.siret })
              )?.etablissements_formateur?.find((etablissement) => etablissement.uai === uai)?.diffusion_autorisee,

              nombre_voeux: etablissement.siret ? await Voeu.countDocuments(voeuxFilter).lean() : 0,

              first_date_voeux: etablissement.siret
                ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
                : null,

              last_date_voeux: etablissement.siret
                ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
                : null,
            };
          }) ?? []
        ),
      });
    })
  );

  router.put(
    "/api/formateur/setEmail",
    checkApiToken(),
    ensureIs(UserType.FORMATEUR),
    tryCatch(async (req, res) => {
      const { uai } = req.user;

      const { email } = await Joi.object({
        email: Joi.string().email(),
      }).validateAsync(req.body, { abortEarly: false });

      email && (await changeEmail(uai, email, { auteur: req.user.username }));

      const updatedFormateur = await Formateur.findOne({ uai });

      res.json(updatedFormateur);
    })
  );

  /**
   * Retourne la liste des responsables associés au formateur connecté
   */
  router.get(
    "/api/formateur/responsables",
    checkApiToken(),
    ensureIs(UserType.FORMATEUR),
    tryCatch(async (req, res) => {
      const { uai } = req.user;
      const formateur = await Formateur.findOne({ uai }).lean();

      if (!formateur?.etablissements_responsable.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          formateur?.etablissements_responsable.map(async (etablissement) => {
            return await Responsable.findOne({ siret: etablissement.siret }).lean();
          }) ?? []
        )
      );
    })
  );

  /**
   * Retourne la liste des voeux pour le formateur connecté sous forme d'un CSV.
   */
  router.get(
    // "/api/formateur/voeux",
    "/api/formateur/responsables/:siret/voeux",
    checkApiToken(),
    ensureIs(UserType.FORMATEUR),
    tryCatch(async (req, res) => {
      const { uai } = req.user;

      const { siret } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const filename = `${siret}-${uai}.csv`;

      await markVoeuxAsDownloadedByFormateur(siret, uai);

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream({ siret, uai }), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  return router;
};
