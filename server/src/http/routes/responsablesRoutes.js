const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { markVoeuxAsDownloadedByResponsable } = require("../../common/actions/markVoeuxAsDownloaded.js");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Responsable, Formateur, Delegue, Relation } = require("../../common/model");
const { uaiFormat } = require("../../common/utils/format.js");
const sendActivationEmails = require("../../jobs/sendActivationEmails.js");
const resendActivationEmails = require("../../jobs/resendActivationEmails.js");
const sendNotificationEmails = require("../../jobs/sendNotificationEmails.js");
const resendNotificationEmails = require("../../jobs/resendNotificationEmails.js");
const sendUpdateEmails = require("../../jobs/sendUpdateEmails.js");
const resendUpdateEmails = require("../../jobs/resendUpdateEmails.js");

const { UserStatut } = require("../../common/constants/UserStatut.js");
const { changeEmail } = require("../../common/actions/changeEmail.js");
const { saveAccountEmailUpdatedByAccount } = require("../../common/actions/history/responsable");
const {
  saveDelegationUpdatedByResponsable,
  saveDelegationCreatedByResponsable,
  saveDelegationCancelledByResponsable,
} = require("../../common/actions/history/relation");
const logger = require("../../common/logger.js");
const { UserType } = require("../../common/constants/UserType.js");

const lookupRelations = {
  from: Relation.collection.name,
  let: { userSiret: "$siret", userUai: "$uai", userType: "$type" },
  pipeline: [
    {
      $match: {
        $expr: {
          $or: [
            {
              $and: [
                { $eq: ["$$userType", UserType.FORMATEUR] },
                { $eq: ["$etablissement_formateur.uai", "$$userUai"] },
              ],
            },
            {
              $and: [
                { $eq: ["$$userType", UserType.RESPONSABLE] },
                { $eq: ["$etablissement_responsable.siret", "$$userSiret"] },
              ],
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: Formateur.collection.name,
        localField: "etablissement_formateur.uai",
        foreignField: "uai",
        pipeline: [
          {
            $match: {
              type: UserType.FORMATEUR,
            },
          },
        ],
        as: "formateur",
      },
    },

    {
      $lookup: {
        from: Responsable.collection.name,
        localField: "etablissement_responsable.siret",
        foreignField: "siret",
        pipeline: [
          {
            $match: {
              type: UserType.RESPONSABLE,
            },
          },
        ],
        as: "responsable",
      },
    },

    {
      $lookup: {
        from: Delegue.collection.name,
        let: {
          siret_responsable: "$etablissement_responsable.siret",
          uai_formateur: "$etablissement_formateur.uai",
        },
        pipeline: [
          {
            $match: {
              type: UserType.DELEGUE,
            },
          },

          {
            $unwind: {
              path: "$relations",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$relations.etablissement_responsable.siret", "$$siret_responsable"] },
                  { $eq: ["$relations.etablissement_formateur.uai", "$$uai_formateur"] },
                  { $eq: ["$relations.active", true] },
                ],
              },
            },
          },
          {
            $group: {
              _id: "$_id",
              root: {
                $first: "$$ROOT",
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: "$root",
            },
          },
          {
            $project: { password: 0 },
          },
        ],
        as: "delegue",
      },
    },

    {
      $unwind: {
        path: "$responsable",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$formateur",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$delegue",
        preserveNullAndEmptyArrays: true,
      },
    },
  ],
  as: "relations",
};

const addCountFields = {
  nombre_voeux: { $sum: "$relations.nombre_voeux" },
  nombre_voeux_restant: { $sum: "$relations.nombre_voeux_restant" },
};

module.exports = ({ users, sendEmail, resendEmail }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  /**
   * Retourne le responsable connecté
   */
  router.get(
    "/api/responsable",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;

      return res.json(
        (
          await Responsable.aggregate([
            {
              $match: {
                type: UserType.RESPONSABLE,
                siret,
              },
            },
            {
              $lookup: lookupRelations,
            },

            {
              $addFields: addCountFields,
            },
          ])
        )?.[0]
      );
    })
  );

  router.put(
    "/api/responsable/setEmail",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret, email: old_email } = req.user;
      const { email } = await Joi.object({
        email: Joi.string().email(),
      }).validateAsync(req.body, { abortEarly: false });

      email && (await changeEmail(req.user.username, email, { auteur: req.user.username }));

      await saveAccountEmailUpdatedByAccount(req.user, email, old_email);

      const updatedResponsable = await Responsable.findOne({ siret });

      res.json(updatedResponsable);
    })
  );

  /**
   * Permet au responsable de modifier les paramètres de diffusion à un de ses formateurs associés (ajout / modification)
   */
  router.post(
    "/api/responsable/delegation",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { email, uai } = await Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const responsable = await Responsable.findOne({ siret }).lean();
      const formateur = await Formateur.findOne({ uai }).lean();

      const previousDelegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret,
            "etablissement_formateur.uai": uai,
            active: true,
          },
        },
      });

      // Suppression de la délégation existante si elle existe déjà entre le responsable et le formateur
      if (previousDelegue) {
        await Delegue.updateOne(
          {
            _id: previousDelegue._id,
          },
          {
            $set: {
              "relations.$[element].active": false,
            },
          },
          {
            arrayFilters: [
              { "element.etablissement_responsable.siret": siret, "element.etablissement_formateur.uai": uai },
            ],
          }
        );
      }

      const delegue = await Delegue.findOne({ email });

      if (
        !delegue?.relations?.filter(
          (relation) =>
            relation.etablissement_responsable.siret === siret && relation.etablissement_formateur.uai === uai
        ).length
      ) {
        await Delegue.updateOne(
          { email },
          {
            $setOnInsert: {
              username: email,
              email,
            },
            $addToSet: {
              relations: {
                etablissement_responsable: {
                  siret: responsable.siret,
                  uai: responsable.uai,
                },
                etablissement_formateur: {
                  siret: formateur?.siret,
                  uai: formateur?.uai,
                },
                active: true,
              },
            },
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
            new: true,
          }
        );
      } else {
        await Delegue.updateOne(
          { email },
          {
            $setOnInsert: {
              username: email,
              email,
            },
            $set: {
              "relations.$[element].active": true,
            },
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
            new: true,
            arrayFilters: [
              { "element.etablissement_responsable.siret": siret, "element.etablissement_formateur.uai": uai },
            ],
          }
        );
      }

      if (previousDelegue) {
        await saveDelegationUpdatedByResponsable({ uai, siret, email }, req.user);
      } else {
        await saveDelegationCreatedByResponsable({ uai, siret, email }, req.user);
      }

      const updatedDelegue = await Delegue.findOne({ email });

      if (updatedDelegue.statut === UserStatut.EN_ATTENTE) {
        await Delegue.updateOne({ email }, { $set: { statut: UserStatut.CONFIRME } });
      }

      const previousActivationEmail = updatedDelegue.emails.find((e) => e.templateName.startsWith("activation_"));
      previousActivationEmail
        ? await resendActivationEmails(resendEmail, { username: email, force: true, sender: req.user })
        : await sendActivationEmails(sendEmail, { username: email, force: true, sender: req.user });

      logger.info(`Délégation activée (${updatedDelegue.email}) pour le formateur ${uai} et le responsable ${siret}`);

      return res.json(updatedDelegue);
    })
  );

  /**
   * Permet au responsable de modifier les paramètres de diffusion à un de ses formateurs associés (suppression)
   */
  router.delete(
    "/api/responsable/delegation",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.siret": siret,
            "etablissement_formateur.uai": uai,
            active: true,
          },
        },
      });

      const updateDelegue = await Delegue.updateOne(
        {
          relations: {
            $elemMatch: {
              "etablissement_responsable.siret": siret,
              "etablissement_formateur.uai": uai,
              active: true,
            },
          },
        },
        {
          $set: {
            "relations.$[element].active": false,
          },
        },
        {
          arrayFilters: [
            { "element.etablissement_responsable.siret": siret, "element.etablissement_formateur.uai": uai },
          ],
        }
      );

      await saveDelegationCancelledByResponsable({ uai, siret, email: delegue?.email }, req.user);

      logger.info(`Délégation désactivée (${delegue.email}) pour le formateur ${uai} et le responsable ${siret}`);

      return res.json(updateDelegue);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/responsable/formateurs/:uai/voeux",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const relation = await Relation.findOne({
        "etablissement_responsable.siret": siret,
        "etablissement_formateur.uai": uai,
      });

      if (!relation) {
        throw Boom.notFound();
      }

      const filename = `${siret}-${uai}.csv`;

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai, active: true },
        },
      });

      if (!delegue) {
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
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai, active: true },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      const previousActivationEmail = delegue.emails.find((e) => e.templateName.startsWith("activation_"));

      const stats = previousActivationEmail
        ? await resendActivationEmails(resendEmail, { username: delegue.username, force: true, sender: req.user })
        : await sendActivationEmails(sendEmail, { username: delegue.username, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendNotificationEmail",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai, active: true },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      const previousNotificationEmail = delegue.emails.find((e) => e.templateName.startsWith("notification_"));

      const stats = previousNotificationEmail
        ? await resendNotificationEmails(resendEmail, { username: delegue.username, force: true, sender: req.user })
        : await sendNotificationEmails(sendEmail, { username: delegue.username, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendUpdateEmail",
    checkApiToken(),
    ensureIs(UserType.RESPONSABLE),
    tryCatch(async (req, res) => {
      const { siret } = req.user;
      const { uai } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai, active: true },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      const previousUpdateEmail = delegue.emails.find((e) => e.templateName.startsWith("update_"));

      const stats = previousUpdateEmail
        ? await resendUpdateEmails(resendEmail, { username: delegue.username, force: true, sender: req.user })
        : await sendUpdateEmails(sendEmail, { username: delegue.username, force: true, sender: req.user });

      return res.json(stats);
    })
  );

  return router;
};
