const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { markVoeuxAsDownloadedByResponsable } = require("../../common/actions/markVoeuxAsDownloaded.js");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Responsable, Formateur } = require("../../common/model/index.js");
const resendNotificationEmails = require("../../jobs/resendNotificationEmails.js");
const { uaiFormat } = require("../../common/utils/format.js");
const sendActivationEmails = require("../../jobs/sendActivationEmails.js");
const resendActivationEmails = require("../../jobs/resendActivationEmails.js");
const { UserStatut } = require("../../common/constants/UserStatut.js");
const { changeEmail } = require("../../common/actions/changeEmail.js");
const { saveAccountEmailUpdatedByAccount } = require("../../common/actions/history/responsable/index.js");
const {
  saveDelegationUpdatedByResponsable,
  saveDelegationCreatedByResponsable,
  saveDelegationCancelledByResponsable,
} = require("../../common/actions/history/formateur/index.js");
const { fillResponsable } = require("../../common/utils/dataUtils.js");

module.exports = ({ users, sendEmail, resendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  /**
   * Retourne le responsable connecté
   */
  router.get(
    "/api/responsable",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const responsable = await Responsable.findOne({ siret }).lean();

      res.json(await fillResponsable(responsable));
    })
  );

  router.put(
    "/api/responsable/setEmail",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { siret, email: old_email } = req.user;
      const { email } = await Joi.object({
        email: Joi.string().email(),
      }).validateAsync(req.body, { abortEarly: false });

      email && (await changeEmail(siret, email, { auteur: req.user.username }));

      await saveAccountEmailUpdatedByAccount({ siret, email }, old_email);

      const updatedResponsable = await Responsable.findOne({ siret });

      res.json(updatedResponsable);
    })
  );

  /**
   * Retourne la liste des formateurs associés au responsable connecté
   */
  router.get(
    "/api/responsable/formateurs",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const responsable = await Responsable.findOne({ siret }).lean();

      if (!responsable?.etablissements_formateur.filter((e) => e.voeux_date).length === 0) {
        return res.json([]);
      }

      res.json(
        await Promise.all(
          responsable?.etablissements_formateur.map(async (etablissement) => {
            return await Formateur.findOne({ uai: etablissement.uai }).lean();
          }) ?? []
        )
      );
    })
  );

  /**
   * Permet au responsable de modifier les paramètres de diffusion à un de ses formateurs associés
   */
  router.put(
    "/api/responsable/formateurs/:uai",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });
      const responsable = await Responsable.findOne({ siret }).lean();

      if (!responsable?.etablissements_formateur.filter((etablissements) => etablissements.uai === uai).length === 0) {
        throw Error("L'UAI n'est pas dans la liste des établissements formateurs liés à votre responsable.");
      }

      const etablissement = responsable?.etablissements_formateur.find((e) => e.uai === uai);

      const etablissements = responsable?.etablissements_formateur.map((etablissement) => {
        if (etablissement.uai === uai) {
          typeof req.body.email !== "undefined" && (etablissement.email = req.body.email);
          typeof req.body.diffusionAutorisee !== "undefined" &&
            (etablissement.diffusionAutorisee = req.body.diffusionAutorisee);
        }
        return etablissement;
      });

      await Responsable.updateOne({ siret: responsable.siret }, { etablissements });

      const formateur = await Formateur.findOne({ uai }).lean();

      if (typeof req.body.email !== "undefined" && req.body.diffusionAutorisee === true) {
        etablissement?.diffusionAutorisee
          ? await saveDelegationUpdatedByResponsable({ ...formateur, email: req.body.email }, req.user)
          : await saveDelegationCreatedByResponsable({ ...formateur, email: req.body.email }, req.user);

        await Formateur.updateOne(
          { uai },
          { $set: { statut: UserStatut.CONFIRME, email: req.body.email, password: null } }
        );
        const previousActivationEmail = formateur.emails.find((e) => e.templateName.startsWith("activation_"));

        previousActivationEmail
          ? await resendActivationEmails(resendEmail, { username: uai, force: true, sender: req.user })
          : await sendActivationEmails(sendEmail, { username: uai, force: true, sender: req.user });
      } else if (req.body.diffusionAutorisee === false) {
        await saveDelegationCancelledByResponsable(
          { ...formateur, email: formateur.email ?? etablissement.email },
          req.user
        );
      }

      const updatedResponsable = await Responsable.findOne({ siret: responsable.siret });

      res.json(updatedResponsable);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/responsable/formateurs/:uai/voeux",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const responsable = await Responsable.findOne({ siret }).lean();

      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const filename = `${siret}-${uai}.csv`;

      if (!req.user?.etablissements.find((e) => e.uai === uai)) {
        throw Boom.notFound();
      }

      if (
        !responsable?.etablissements_formateur.find((etablissement) => etablissement.uai === uai)?.diffusionAutorisee
      ) {
        await markVoeuxAsDownloadedByResponsable(siret, uai);
      }

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream({ siret, uai }), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendActivationEmail",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const stats = await resendActivationEmails(resendEmail, { username: uai, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendNotificationEmail",
    checkApiToken(),
    ensureIs("Responsable"),
    tryCatch(async (req, res) => {
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const stats = await resendNotificationEmails(resendEmail, { username: uai, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  return router;
};
