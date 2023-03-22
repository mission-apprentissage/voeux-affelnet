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

  router.get(
    "/api/gestionnaire",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      res.json(gestionnaire);
    })
  );

  router.get(
    "/api/gestionnaire/formateurs",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      if (!gestionnaire.formateurs.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          gestionnaire.formateurs.map(async (formateur) => {
            return await Formateur.findOne({ uai: formateur.uai });
          })
        )
      );
    })
  );

  router.put(
    "/api/gestionnaire/formateurs/:uai",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      if (!gestionnaire.formateurs.filter((formateur) => formateur.uai === req.params.uai).length === 0) {
        throw Error("L'UAI n'est pas dans la liste des établissements formateurs liés à votre gestionnaire.");
      }

      const formateurs = gestionnaire.formateurs.map((formateur) => {
        if (formateur.uai === req.params.uai) {
          formateur.email = req.body.email;
        }
        return formateur;
      });

      await Gestionnaire.updateOne({ siret: gestionnaire.siret }, { formateurs });

      const updatedGestionnaire = await Gestionnaire.findOne({ siret: gestionnaire.siret });

      res.json(updatedGestionnaire);
    })
  );

  router.get(
    "/api/gestionnaire/fichiers",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const gestionnaire = req.user;

      if (!gestionnaire.formateurs.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          gestionnaire.formateurs
            .filter((formateur) => !!formateur.voeux_date)
            .map(async (formateur) => {
              const telechargements = gestionnaire.voeux_telechargements
                .filter((t) => t.uai === formateur.uai && t.date >= formateur.voeux_date)
                .sort((a, b) => {
                  return a - b;
                });

              return {
                //voeux
                name: `${formateur.uai}.csv`,
                date: formateur.voeux_date,
                formateur: await Formateur.findOne({ uai: formateur.uai }),
                lastDownloadDate: telechargements[0]?.date || null,
              };
            })
        )
      );
    })
  );

  router.get(
    "/api/gestionnaire/fichiers/:file",
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

      if (!req.user.formateurs.find((e) => e.uai === uai)) {
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
