const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { markVoeuxAsDownloadedByGestionnaire } = require("../../common/actions/markVoeuxAsDownloaded");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Gestionnaire, Formateur, Voeu } = require("../../common/model");
const resendNotificationEmails = require("../../jobs/resendNotificationEmails");
const { uaiFormat } = require("../../common/utils/format");
const sendConfirmationEmails = require("../../jobs/sendConfirmationEmails");
const resendConfirmationEmails = require("../../jobs/resendConfirmationEmails");
const { UserStatut } = require("../../common/constants/UserStatut");
const { changeEmail } = require("../../common/actions/changeEmail");

module.exports = ({ users, sendEmail, resendEmail }) => {
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
      const { siret } = req.user;
      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      res.json({
        ...gestionnaire,

        nombre_voeux: await Voeu.countDocuments({ "etablissement_gestionnaire.siret": siret }),

        etablissements: await Promise.all(
          gestionnaire?.etablissements?.map(async (etablissement) => {
            const voeuxFilter = {
              "etablissement_accueil.uai": etablissement.uai,
              "etablissement_gestionnaire.siret": siret,
            };

            const voeux = await Voeu.find(voeuxFilter);

            return {
              ...etablissement,

              nombre_voeux: etablissement.uai ? await Voeu.countDocuments(voeuxFilter).lean() : 0,

              first_date_voeux: etablissement.uai
                ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(a) - new Date(b))[0]
                : null,

              last_date_voeux: etablissement.uai
                ? voeux.flatMap((voeu) => voeu._meta.import_dates).sort((a, b) => new Date(b) - new Date(a))[0]
                : null,
            };
          })
        ),
      });
    })
  );

  router.put(
    "/api/gestionnaire/setEmail",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { email } = await Joi.object({
        email: Joi.string().email(),
      }).validateAsync(req.body, { abortEarly: false });

      email && (await changeEmail(siret, email, { auteur: req.user.username }));

      const updatedGestionnaire = await Gestionnaire.findOne({ siret });

      res.json(updatedGestionnaire);
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
      const { siret } = req.user;
      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      if (!gestionnaire?.etablissements.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          gestionnaire?.etablissements.map(async (etablissement) => {
            return await Formateur.findOne({ uai: etablissement.uai }).lean();
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
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });
      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      if (!gestionnaire?.etablissements.filter((etablissements) => etablissements.uai === uai).length === 0) {
        throw Error("L'UAI n'est pas dans la liste des établissements formateurs liés à votre gestionnaire.");
      }

      const etablissements = gestionnaire?.etablissements.map((etablissement) => {
        if (etablissement.uai === uai) {
          typeof req.body.email !== "undefined" && (etablissement.email = req.body.email);
          typeof req.body.diffusionAutorisee !== "undefined" &&
            (etablissement.diffusionAutorisee = req.body.diffusionAutorisee);
        }
        return etablissement;
      });

      await Gestionnaire.updateOne({ siret: gestionnaire.siret }, { etablissements });

      if (typeof req.body.email !== "undefined" && req.body.diffusionAutorisee === true) {
        const formateur = await Formateur.findOne({ uai });
        await Formateur.updateOne({ uai }, { $set: { statut: UserStatut.EN_ATTENTE } });
        const previousConfirmationEmail = formateur.emails.find((e) => e.templateName.startsWith("confirmation_"));

        previousConfirmationEmail
          ? await resendConfirmationEmails(resendEmail, { username: uai, force: true })
          : await sendConfirmationEmails(sendEmail, { username: uai });
      }

      const updatedGestionnaire = await Gestionnaire.findOne({ siret: gestionnaire.siret });

      res.json(updatedGestionnaire);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/gestionnaire/formateurs/:uai/voeux",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const gestionnaire = await Gestionnaire.findOne({ siret }).lean();

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const filename = `${siret}-${uai}.csv`;

      if (!req.user?.etablissements.find((e) => e.uai === uai)) {
        throw Boom.notFound();
      }

      if (!gestionnaire?.etablissements.find((etablissement) => etablissement.uai === uai)?.diffusionAutorisee) {
        await markVoeuxAsDownloadedByGestionnaire(siret, uai);
      }

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream({ siret, uai }), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  /**
   * TODO : Renvoi l'email de notification
   */
  router.put(
    "/api/gestionnaire/formateurs/:uai/resendNotificationEmail",
    checkApiToken(),
    ensureIs("Gestionnaire"),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const stats = await resendNotificationEmails(resendEmail, { username: uai, force: true });

      return res.json(stats);
    })
  );

  return router;
};
