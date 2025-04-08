const express = require("express");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { markVoeuxAsDownloadedByDelegue } = require("../../common/actions/markVoeuxAsDownloaded.js");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Etablissement, Delegue, Relation } = require("../../common/model");
const { siretFormat } = require("../../common/utils/format.js");
const { changeEmail } = require("../../common/actions/changeEmail.js");
const { USER_TYPE } = require("../../common/constants/UserType.js");

const {
  saveAccountEmailUpdatedByAccount,
} = require("../../common/actions/history/delegue/accountEmailUpdatedByAccount.js");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkApiToken, ensureIs } = authMiddleware(users);

  /**
   * Retourne le délégué connecté
   */
  router.get(
    "/api/delegue",
    checkApiToken(),
    ensureIs(USER_TYPE.DELEGUE),
    tryCatch(async (req, res) => {
      const { email } = req.user;

      const delegue = (
        await Delegue.aggregate([
          { $match: { email } },
          { $unwind: "$relations" },
          {
            $lookup: {
              from: Relation.collection.name,
              let: {
                siret_responsable: "$relations.etablissement_responsable.siret",
                siret_formateur: "$relations.etablissement_formateur.siret",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                        { $eq: ["$etablissement_formateur.siret", "$$siret_formateur"] },
                      ],
                    },
                  },
                },
                {
                  $lookup: {
                    from: Etablissement.collection.name,
                    localField: "etablissement_responsable.siret",
                    foreignField: "siret",
                    as: "responsable",
                  },
                },
                {
                  $lookup: {
                    from: Etablissement.collection.name,
                    localField: "etablissement_formateur.siret",
                    foreignField: "siret",
                    as: "formateur",
                  },
                },
                { $unwind: { path: "$responsable", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$formateur", preserveNullAndEmptyArrays: true } },
              ],
              as: "relations_",
            },
          },
          {
            $addFields: {
              tempRelations: { $mergeObjects: ["$relations", { $arrayElemAt: ["$relations_", 0] }] },
            },
          },
          {
            $group: {
              _id: "$_id",
              root: { $first: "$$ROOT" },
              newRelations: { $push: "$tempRelations" },
            },
          },

          { $replaceRoot: { newRoot: { $mergeObjects: ["$root", { relations: "$newRelations" }] } } },

          { $project: { newRelations: 0, relations_: 0, tempRelations: 0 } },
        ])
      )?.[0];

      // TODO : filter active delegations

      res.json(delegue);
    })
  );

  router.put(
    "/api/delegue/setEmail",
    checkApiToken(),
    ensureIs(USER_TYPE.DELEGUE),
    tryCatch(async (req, res) => {
      const { email } = await Joi.object({
        email: Joi.string().email(),
      }).validateAsync(req.body, { abortEarly: false });

      email && (await changeEmail(req.user.username, email, { auteur: req.user.username }));

      const updatedDelegue = await Delegue.findOne({ email });

      await saveAccountEmailUpdatedByAccount(updatedDelegue, email, req.user.email);
      res.json(updatedDelegue);
    })
  );

  /**
   * Retourne la liste des voeux pour la relation responsable-formateur sous forme d'un CSV.
   */
  router.get(
    "/api/delegue/:siret_responsable/:siret_formateur/voeux",
    checkApiToken(),
    ensureIs(USER_TYPE.DELEGUE),
    tryCatch(async (req, res) => {
      const { email } = req.user;

      const { siret_responsable, siret_formateur } = await Joi.object({
        siret_responsable: Joi.string().pattern(siretFormat).required(),
        siret_formateur: Joi.string().pattern(siretFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({ email });

      if (
        !delegue.relations.find(
          (relation) =>
            relation.active &&
            relation.etablissement_responsable.siret === siret_responsable &&
            relation.etablissement_formateur.siret === siret_formateur
        )
      ) {
        throw Error("La ressource n'est pas accessible.");
      }

      const filename = `${siret_responsable}-${siret_formateur}.csv`;

      await markVoeuxAsDownloadedByDelegue({ siret_responsable, siret_formateur });

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(
        getVoeuxStream({ siret_responsable, siret_formateur }),
        transformIntoCSV({ mapper: (v) => `"${v || ""}"` }),
        res
      );
    })
  );

  return router;
};
