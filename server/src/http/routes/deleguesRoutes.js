const express = require("express");
const Joi = require("@hapi/joi");
const { compose, transformIntoCSV } = require("oleoduc");
const tryCatch = require("../middlewares/tryCatchMiddleware.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { markVoeuxAsDownloadedByDelegue } = require("../../common/actions/markVoeuxAsDownloaded.js");
const { getVoeuxStream } = require("../../common/actions/getVoeuxStream.js");
const { Delegue, Responsable, Formateur, Relation } = require("../../common/model");
const { siretFormat, uaiFormat } = require("../../common/utils/format.js");
const { changeEmail } = require("../../common/actions/changeEmail.js");
const { UserType } = require("../../common/constants/UserType.js");

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
    ensureIs(UserType.DELEGUE),
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
                uai_formateur: "$relations.etablissement_formateur.uai",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                        { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
                      ],
                    },
                  },
                },
                {
                  $lookup: {
                    from: Responsable.collection.name,
                    localField: "etablissement_responsable.siret",
                    foreignField: "siret",
                    pipeline: [
                      {
                        $match: { type: UserType.RESPONSABLE },
                      },
                    ],
                    as: "responsable",
                  },
                },
                {
                  $lookup: {
                    from: Formateur.collection.name,
                    localField: "etablissement_formateur.uai",
                    foreignField: "uai",
                    pipeline: [
                      {
                        $match: { type: UserType.FORMATEUR },
                      },
                    ],
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

      // TODO : filter active delegatiosn

      res.json(delegue);
    })
  );

  router.put(
    "/api/delegue/setEmail",
    checkApiToken(),
    ensureIs(UserType.DELEGUE),
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
    "/api/delegue/:siret/:uai/voeux",
    checkApiToken(),
    ensureIs(UserType.DELEGUE),
    tryCatch(async (req, res) => {
      const { email } = req.user;

      const { siret, uai } = await Joi.object({
        siret: Joi.string().pattern(siretFormat).required(),
        uai: Joi.string().pattern(uaiFormat).required(),
      }).validateAsync(req.params, { abortEarly: false });

      const delegue = await Delegue.findOne({ email });

      if (
        !delegue.relations.find(
          (relation) =>
            relation.active &&
            relation.etablissement_responsable.siret === siret &&
            relation.etablissement_formateur.uai === uai
        )
      ) {
        throw Error("La ressource n'est pas accessible.");
      }

      const filename = `${siret}-${uai}.csv`;

      await markVoeuxAsDownloadedByDelegue(siret, uai);

      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", `text/csv; charset=UTF-8`);
      return compose(getVoeuxStream({ siret, uai }), transformIntoCSV({ mapper: (v) => `"${v || ""}"` }), res);
    })
  );

  return router;
};
