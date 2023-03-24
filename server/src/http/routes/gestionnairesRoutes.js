const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../../common/validators.js");
const { markVoeuxAsDownloaded } = require("../../common/actions/markVoeuxAsDownloaded");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Gestionnaire, Formateur } = require("../../common/model");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  /**
   * Retourne le gestionnaire connecté
   */
  router.get(
    "/api/gestionnaire",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      res.json(gestionnaire);
    })
  );

  /**
   * Retourne la liste des formateurs associés au gestionnaire connecté
   */
  router.get(
    "/api/gestionnaire/formateurs",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      if (!gestionnaire.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          gestionnaire.etablissements.map(async (etablissement) => {
            return await Formateur.findOne({ uai: etablissement.uai });
          })
        )
      );
    })
  );

  /**
   * Permet au gestionnaire de modifier les paramètres de diffusion à un de ses formateurs associés
   */
  router.put(
    "/api/gestionnaire/formateurs/:uai",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      if (!gestionnaire.etablissements.filter((etablissements) => etablissements.uai === req.params.uai).length === 0) {
        throw Error("L'UAI n'est pas dans la liste des établissements formateurs liés à votre gestionnaire.");
      }

      const etablissements = gestionnaire.etablissements.map((etablissement) => {
        if (etablissement.uai === req.params.uai) {
          req.body.email && (etablissement.email = req.body.email);
          req.body.diffusionAutorisee && (etablissement.diffusionAutorisee = req.body.diffusionAutorisee);
        }
        return etablissement;
      });

      await Gestionnaire.updateOne({ siret: gestionnaire.siret }, { etablissements });

      const updatedGestionnaire = await Gestionnaire.findOne({ siret: gestionnaire.siret });

      res.json(updatedGestionnaire);
    })
  );

  // /**
  //  * TODO : A modifier en une route par formateur ?
  //  */
  // router.get(
  //   "/api/gestionnaire/fichiers",
  //   checkApiToken(),
  //   ensureIs("Gestionnaire"),
  //   tryCatch(async (req, res) => {
  //     const gestionnaire = req.user;

  //     if (!gestionnaire.etablissements.filter((e) => e.voeux_date).length === 0) {
  //       return res.json([]);
  //     }

  //     res.json(
  //       await Promise.all(
  //         gestionnaire.etablissements
  //           .filter((etablissement) => !!etablissement.voeux_date)
  //           .map(async (etablissement) => {
  //             const telechargements = gestionnaire.voeux_telechargements
  //               .filter((t) => t.uai === etablissement.uai && t.date >= etablissement.voeux_date)
  //               .sort((a, b) => {
  //                 return a - b;
  //               });

  //             return {
  //               //voeux
  //               name: `${etablissement.uai}.csv`,
  //               date: etablissement.voeux_date,
  //               formateur: await Formateur.findOne({ uai: etablissement.uai }),
  //               lastDownloadDate: telechargements[0]?.date || null,
  //             };
  //           })
  //       )
  //     );
  //   })
  // );

  /**
   * TODO : A modifier en une route par formateur ?
   */

  router.get(
    "/api/gestionnaire/formateurs/:file",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { file } = await validate(req.params, {
        file: Joi.string()
          .pattern(/^[0-9]{7}[A-Z]{1}\.csv$/)
          .required(),
      });

      const uai = file.split(".csv")[0];
      // const uai = req.params.uai;

      if (!req.user.etablissements.find((e) => e.uai === uai)) {
        throw Boom.notFound();
      }

      await markVoeuxAsDownloaded(siret, uai);
      res.setHeader("Content-disposition", `attachment; filename=${uai}.csv`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream(uai), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  return router;
};
