const express = require("express");
const Boom = require("boom");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { markVoeuxAsDownloadedByResponsable } = require("../../common/actions/markVoeuxAsDownloaded.js");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Delegue, Relation, Etablissement } = require("../../common/model");
const { uaiFormat } = require("../../common/utils/format.js");
const sendActivationEmails = require("../../jobs/sendActivationEmails.js");
// const resendActivationEmails = require("../../jobs/resendActivationEmails.js");
const sendNotificationEmails = require("../../jobs/sendNotificationEmails.js");
// const resendNotificationEmails = require("../../jobs/resendNotificationEmails.js");
const sendUpdateEmails = require("../../jobs/sendUpdateEmails.js");
// const resendUpdateEmails = require("../../jobs/resendUpdateEmails.js");

const { UserStatut } = require("../../common/constants/UserStatut.js");
const { changeEmail } = require("../../common/actions/changeEmail.js");
const { saveAccountEmailUpdatedByAccount } = require("../../common/actions/history/responsable/index.js");
const {
  saveDelegationUpdatedByResponsable,
  saveDelegationCreatedByResponsable,
  saveDelegationCancelledByResponsable,
} = require("../../common/actions/history/relation");
const logger = require("../../common/logger.js");
const { UserType } = require("../../common/constants/UserType.js");

const lookupRelations = {
  from: Relation.collection.name,
  let: { uai: "$uai" },
  pipeline: [
    {
      $match: {
        $expr: {
          $or: [
            {
              $and: [{ $eq: ["$etablissement_formateur.uai", "$$uai"] }],
            },
            {
              $and: [{ $eq: ["$etablissement_responsable.uai", "$$uai"] }],
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: Etablissement.collection.name,
        localField: "etablissement_formateur.uai",
        foreignField: "uai",
        as: "formateur",
      },
    },

    {
      $lookup: {
        from: Etablissement.collection.name,
        localField: "etablissement_responsable.uai",
        foreignField: "uai",
        as: "responsable",
      },
    },

    {
      $lookup: {
        from: Delegue.collection.name,
        let: {
          uai_responsable: "$etablissement_responsable.uai",
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
                  { $eq: ["$relations.etablissement_responsable.uai", "$$uai_responsable"] },
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

const addTypeFields = {
  is_responsable: {
    $reduce: {
      input: "$relations",
      initialValue: false,
      in: {
        $cond: [
          {
            $or: [
              {
                $eq: ["$$this.etablissement_responsable.uai", "$uai"],
              },
              {
                $eq: ["$$value", true],
              },
            ],
          },
          true,
          false,
        ],
      },
    },
  },

  is_formateur: {
    $reduce: {
      input: "$relations",
      initialValue: false,
      in: {
        $cond: [
          {
            $or: [
              {
                $eq: ["$$this.etablissement_formateur.uai", "$uai"],
              },
              {
                $eq: ["$$value", true],
              },
            ],
          },
          true,
          false,
        ],
      },
    },
  },

  is_responsable_formateur: {
    $reduce: {
      input: "$relations",
      initialValue: false,
      in: {
        $cond: [
          {
            $or: [
              {
                $eq: ["$$this.etablissement_responsable.uai", "$$this.etablissement_formateur.uai"],
              },
              {
                $eq: ["$$value", true],
              },
            ],
          },
          true,
          false,
        ],
      },
    },
  },
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
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai } = req.user;

      const responsable = (
        await Etablissement.aggregate([
          {
            $match: {
              type: UserType.ETABLISSEMENT,
              uai,
            },
          },
          { $lookup: lookupRelations },
          { $addFields: addTypeFields },
          { $match: { is_responsable: true } },
          { $addFields: addCountFields },
        ])
      )?.[0];

      if (!responsable) {
        throw Boom.unauthorized("Vous n'êtes pas identifié comme responsable d'offres de formation");
      }

      res.json(responsable);
    })
  );

  router.put(
    "/api/responsable/setEmail",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai, email: old_email } = req.user;
      const { email } = await Joi.object({
        email: Joi.string().email(),
      }).validateAsync(req.body, { abortEarly: false });

      email && (await changeEmail(req.user.username, email, { auteur: req.user.username }));

      await saveAccountEmailUpdatedByAccount(req.user, email, old_email);

      const updatedResponsable = await Etablissement.findOne({ uai });

      res.json(updatedResponsable);
    })
  );

  /**
   * Permet au responsable de modifier les paramètres de diffusion à un de ses formateurs associés (ajout / modification)
   */
  router.post(
    "/api/responsable/delegation",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai: uai_responsable } = req.user;
      const { email, uai: uai_formateur } = await Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const responsable = await Etablissement.findOne({ uai: uai_responsable }).lean();
      const formateur = await Etablissement.findOne({ uai: uai_formateur }).lean();

      const previousDelegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": uai_responsable,
            "etablissement_formateur.uai": uai_formateur,
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
              {
                "element.etablissement_responsable.uai": uai_responsable,
                "element.etablissement_formateur.uai": uai_formateur,
              },
            ],
          }
        );
      }

      const delegue = await Delegue.findOne({ email });

      if (
        !delegue?.relations?.filter(
          (relation) =>
            relation.etablissement_responsable.uai === uai_responsable &&
            relation.etablissement_formateur.uai === uai_formateur
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
                  uai: responsable.uai,
                },
                etablissement_formateur: {
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
              {
                "element.etablissement_responsable.uai": uai_responsable,
                "element.etablissement_formateur.uai": uai_formateur,
              },
            ],
          }
        );
      }

      if (previousDelegue) {
        await saveDelegationUpdatedByResponsable({ uai_responsable, uai_formateur, email }, req.user);
      } else {
        await saveDelegationCreatedByResponsable({ uai_responsable, uai_formateur, email }, req.user);
      }

      const updatedDelegue = await Delegue.findOne({ email });

      if (updatedDelegue.statut === UserStatut.EN_ATTENTE) {
        await Delegue.updateOne({ email }, { $set: { statut: UserStatut.CONFIRME } });
      }

      await sendActivationEmails({ sendEmail, resendEmail }, { username: email, force: true, sender: req.user });

      logger.info(
        `Délégation activée (${updatedDelegue.email}) pour le formateur ${uai_formateur} et le responsable ${uai_responsable}`
      );

      res.json(updatedDelegue);
    })
  );

  /**
   * Permet au responsable de modifier les paramètres de diffusion à un de ses formateurs associés (suppression)
   */
  router.delete(
    "/api/responsable/delegation",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai: uai_responsable } = req.user;
      const { uai: uai_formateur } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": uai_responsable,
            "etablissement_formateur.uai": uai_formateur,
            active: true,
          },
        },
      });

      const updateDelegue = await Delegue.updateOne(
        {
          relations: {
            $elemMatch: {
              "etablissement_responsable.uai": uai_responsable,
              "etablissement_formateur.uai": uai_formateur,
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
            {
              "element.etablissement_responsable.uai": uai_responsable,
              "element.etablissement_formateur.uai": uai_formateur,
            },
          ],
        }
      );

      await saveDelegationCancelledByResponsable({ uai_responsable, uai_formateur, email: delegue?.email }, req.user);

      logger.info(
        `Délégation désactivée (${delegue.email}) pour le formateur ${uai_formateur} et le responsable ${uai_responsable}`
      );

      res.json(updateDelegue);
    })
  );

  /**
   * Retourne la liste des voeux pour un formateur donné sous forme d'un CSV.
   */
  router.get(
    "/api/responsable/formateurs/:uai/voeux",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai: uai_responsable } = req.user;
      const { uai: uai_formateur } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const relation = await Relation.findOne({
        "etablissement_responsable.uai": uai_responsable,
        "etablissement_formateur.uai": uai_formateur,
      });

      if (!relation) {
        throw Boom.notFound();
      }

      const filename = `${uai_responsable}-${uai_formateur}.csv`;

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": uai_responsable,
            "etablissement_formateur.uai": uai_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        await markVoeuxAsDownloadedByResponsable(uai_responsable, uai_formateur);
      }

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(
        getVoeuxStream({ uai_responsable, uai_formateur }),
        transformIntoCSV({ mapper: (v) => `"${v || ""}"` }),
        res
      );
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendActivationEmail",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai: uai_responsable } = req.user;
      const { uai: uai_formateur } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": uai_responsable,
            "etablissement_formateur.uai": uai_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      const stats = await sendActivationEmails(
        { sendEmail, resendEmail },
        { username: delegue.username, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendNotificationEmail",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai: uai_responsable } = req.user;
      const { uai: uai_formateur } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": uai_responsable,
            "etablissement_formateur.uai": uai_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      const stats = await sendNotificationEmails(
        { sendEmail, resendEmail },
        {
          username: delegue.username,
          force: true,
          sender: req.user,
        }
      );

      res.json(stats);
    })
  );

  router.put(
    "/api/responsable/formateurs/:uai/resendUpdateEmail",
    checkApiToken(),
    ensureIs(UserType.ETABLISSEMENT),
    tryCatch(async (req, res) => {
      const { uai: uai_responsable } = req.user;
      const { uai: uai_formateur } = await Joi.object({
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({
        relations: {
          $elemMatch: {
            "etablissement_responsable.uai": uai_responsable,
            "etablissement_formateur.uai": uai_formateur,
            active: true,
          },
        },
      });

      if (!delegue) {
        throw Boom.notFound();
      }

      const stats = sendUpdateEmails(
        { sendEmail, resendEmail },
        { username: delegue.username, force: true, sender: req.user }
      );

      res.json(stats);
    })
  );

  return router;
};
