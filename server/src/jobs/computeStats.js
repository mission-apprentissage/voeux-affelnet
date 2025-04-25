const { Voeu, Relation, Delegue, Etablissement } = require("../common/model");
const { promiseAllProps } = require("../common/utils/asyncUtils");
const { getAcademies } = require("../common/academies");
const { USER_TYPE } = require("../common/constants/UserType");
const { USER_STATUS } = require("../common/constants/UserStatus");

const SIRET_RECENSEMENT = "99999999999999";

// A mettre à jour fonction de la liste des UAIs associés au siret 99999999999999 dans le fichier des relations
const UAIS_RECENSEMENT = [
  "0089999A",
  "0109999P",
  "0119999J",
  "0130178Y",
  "0249999N",
  "0309999F",
  "0311762X",
  "0339999P",
  "0349999J",
  "0409999B",
  "0440087F",
  "0479999N",
  "0489999H",
  "0529999L",
  "0649999W",
  "0669999K",
  "0679999E",
  "0689999Z",
  "0690133V",
  "0899999K",
];

const computeOrganismesStats = async (filter = {}) => {
  const voeuxFilter = {
    "etablissement_accueil.uai": { $nin: UAIS_RECENSEMENT },
  };

  const relationEtablissementsFilter = {
    "etablissement_responsable.siret": { $ne: SIRET_RECENSEMENT },
    "etablissement_formateur.siret": { $ne: SIRET_RECENSEMENT },
  };

  const relationAcademieFilter = {
    ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}),
  };

  return promiseAllProps({
    totalResponsable: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $group: {
          _id: "$etablissement_responsable.siret",
          siret: { $first: "$etablissement_responsable.siret" },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalResponsableConfirmed: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $group: {
          _id: "$etablissement_responsable.siret",
          siret: { $first: "$etablissement_responsable.siret" },
        },
      },
      {
        $lookup: {
          from: Etablissement.collection.name,
          let: {
            siret_responsable: "$siret",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$siret", "$$siret_responsable"] }, { $eq: ["$type", USER_TYPE.ETABLISSEMENT] }],
                },
              },
            },
          ],
          as: "responsable",
        },
      },
      { $unwind: "$responsable" },
      {
        $match: {
          "responsable.statut": USER_STATUS.CONFIRME,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalResponsableActivated: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $group: {
          _id: "$etablissement_responsable.siret",
          siret: { $first: "$etablissement_responsable.siret" },
        },
      },
      {
        $lookup: {
          from: Etablissement.collection.name,
          let: {
            siret_responsable: "$siret",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$siret", "$$siret_responsable"] }, { $eq: ["$type", USER_TYPE.ETABLISSEMENT] }],
                },
              },
            },
          ],
          as: "responsable",
        },
      },
      { $unwind: "$responsable" },
      {
        $match: {
          "responsable.statut": USER_STATUS.ACTIVE,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalResponsableAvecDelegation: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_responsable: "$etablissement_responsable.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
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
                    //{ $eq: ["$relations.active", true] },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$etablissement_responsable.siret",
          siret: { $first: "$etablissement_responsable.siret" },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalResponsableMultiOrganismes: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },

      {
        $group: {
          _id: "$etablissement_responsable.siret",
          siret_responsable: { $first: "$etablissement_responsable.siret" },
          sirets_formateurs: { $addToSet: "$etablissement_formateur.siret" },
        },
      },
      { $match: { "sirets_formateurs.1": { $exists: true } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalDelegue: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_responsable: "$etablissement_responsable.siret",
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
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
                    { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                    //{ $eq: ["$relations.active", true] },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: false,
        },
      },
      { $group: { _id: "$delegue._id", delegue: { $first: "$delegue" } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalDelegueActivated: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_responsable: "$etablissement_responsable.siret",
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
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
                    { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                    //{ $eq: ["$relations.active", true] },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: false,
        },
      },
      { $group: { _id: "$delegue.username", delegue: { $first: "$delegue" } } },
      {
        $match: {
          "delegue.statut": USER_STATUS.ACTIVE,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalFormateur: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $group: {
          _id: "$etablissement_formateur.siret",
          siret: { $first: "$etablissement_formateur.siret" },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalFormateurAvecDelegation: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
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
                    { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                    //{ $eq: ["$relations.active", true] },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$etablissement_formateur.siret",
          siret: { $first: "$etablissement_formateur.siret" },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalAccueil: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Voeu.collection.name,
          let: {
            siret_responsable: "$etablissement_responsable.siret",
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                    { $eq: ["$etablissement_formateur.siret", "$$siret_formateur"] },
                  ],
                },
              },
            },
          ],
          as: "voeux",
        },
      },
      {
        $unwind: {
          path: "$voeux",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$voeux.etablissement_accueil.uai",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),
  });
};

const computeVoeuxStats = async (filter = {}) => {
  // const uais = (await Formateur.find(filter).select({ uai: 1 }))
  //   .map((formateur) => formateur?.uai)
  //   .filter((uai) => !UAIS_RECENSEMENT.includes(uai));

  const etablissements = await Etablissement.distinct("siret");
  const responsables = (await Relation.distinct("etablissement_responsable.siret")).filter((siret) =>
    etablissements.includes(siret)
  );
  const formateurs = (await Relation.distinct("etablissement_formateur.siret")).filter((siret) =>
    etablissements.includes(siret)
  );

  console.log({ responsables, formateurs });

  const voeuxFilter = {
    "etablissement_responsable.siret": { $ne: SIRET_RECENSEMENT },
    "etablissement_formateur.siret": { $ne: SIRET_RECENSEMENT },
    "etablissement_accueil.uai": { $nin: UAIS_RECENSEMENT },
  };

  const relationEtablissementsFilter = {
    "etablissement_responsable.siret": { $ne: SIRET_RECENSEMENT, $in: responsables },
    "etablissement_formateur.siret": { $ne: SIRET_RECENSEMENT, $in: formateurs },
  };

  const relationAcademieFilter = {
    ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}),
  };

  return promiseAllProps({
    total: Voeu.aggregate([
      {
        $match: {
          ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}),
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    // totalDiffusable: Relation.aggregate([
    //   {
    //     $match: {
    //       ...relationEtablissementsFilter,
    //       ...relationAcademieFilter,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       total: { $sum: "$nombre_voeux" },
    //     },
    //   },
    // ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    apprenants: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Voeu.collection.name,
          let: {
            siret_responsable: "$etablissement_responsable.siret",
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                $and: [
                  { ...voeuxFilter },
                  {
                    $expr: {
                      $and: [
                        { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                        { $eq: ["$etablissement_formateur.siret", "$$siret_formateur"] },
                      ],
                    },
                  },
                ],
              },
            },
          ],
          as: "voeux",
        },
      },
      {
        $unwind: {
          path: "$voeux",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$voeux.apprenant.ine",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    responsablesInconnus: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              "etablissement_responsable.siret": {
                $exists: true,
                $nin: responsables,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$etablissement_responsable.siret",
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    responsablesInconnusNbVoeux: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              "etablissement_responsable.siret": {
                $exists: true,
                $nin: responsables,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$etablissement_responsable.siret",
          nbVoeux: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$nbVoeux" },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    responsablesUndefinedNbVoeux: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              "etablissement_responsable.siret": {
                $exists: false,
              },
            },
          ],
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    formateursInconnus: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              "etablissement_formateur.siret": {
                $exists: true,
                $nin: formateurs,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$etablissement_formateur.siret",
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    formateursInconnusNbVoeux: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              "etablissement_formateur.siret": {
                $exists: true,
                $nin: formateurs,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$etablissement_formateur.siret",
          nbVoeux: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$nbVoeux" },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    formateursUndefinedNbVoeux: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              "etablissement_formateur.siret": {
                $exists: false,
              },
            },
          ],
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalRecensement: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            {
              $or: [
                { "etablissement_responsable.siret": { $eq: SIRET_RECENSEMENT } },
                { "etablissement_formateur.siret": { $eq: SIRET_RECENSEMENT } },
                { "etablissement_accueil.uai": { $in: UAIS_RECENSEMENT } },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalDiffusable: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },

            { "etablissement_responsable.siret": { $exists: true } },
            {
              "etablissement_responsable.siret": {
                $in: responsables,
              },
            },
            { "etablissement_formateur.siret": { $exists: true } },
            {
              "etablissement_formateur.siret": {
                $in: formateurs,
              },
            },
          ],
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    totalNonDiffusable: Voeu.aggregate([
      {
        $match: {
          $and: [
            { ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}) },
            { ...voeuxFilter },
            {
              $or: [
                { "etablissement_responsable.siret": { $exists: false } },
                {
                  "etablissement_responsable.siret": {
                    $nin: responsables,
                  },
                },
                { "etablissement_formateur.siret": { $exists: false } },
                {
                  "etablissement_formateur.siret": {
                    $nin: formateurs,
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    nbVoeux: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$nombre_voeux" },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    nbVoeuxDiffusés: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $group: {
          _id: null,
          nombre_voeux: { $sum: "$nombre_voeux" },
          nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
        },
      },
      {
        $addFields: {
          total: {
            $subtract: ["$nombre_voeux", "$nombre_voeux_restant"],
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    nbVoeuxDiffusésResponsable: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
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
                    { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                    //{ $eq: ["$relations.active", true] },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { delegue: null } },
      {
        $group: {
          _id: null,
          nombre_voeux: { $sum: "$nombre_voeux" },
          nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
        },
      },
      {
        $addFields: {
          total: {
            $subtract: ["$nombre_voeux", "$nombre_voeux_restant"],
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    nbVoeuxDiffusésFormateur: Relation.aggregate([
      {
        $match: {
          ...relationEtablissementsFilter,
          ...relationAcademieFilter,
        },
      },
      {
        $lookup: {
          from: Delegue.collection.name,
          let: {
            siret_formateur: "$etablissement_formateur.siret",
          },
          pipeline: [
            {
              $match: {
                type: USER_TYPE.DELEGUE,
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
                    { $eq: ["$relations.etablissement_formateur.siret", "$$siret_formateur"] },
                    //{ $eq: ["$relations.active", true] },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { delegue: { $ne: null } } },
      {
        $group: {
          _id: null,
          nombre_voeux: { $sum: "$nombre_voeux" },
          nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
        },
      },
      {
        $addFields: {
          total: {
            $subtract: ["$nombre_voeux", "$nombre_voeux_restant"],
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),
  });
};

const computeProgressesStats = async (filter = {}) => {
  const relationEtablissementsFilter = {
    "etablissement_responsable.siret": { $ne: SIRET_RECENSEMENT },
    "etablissement_formateur.siret": { $nin: UAIS_RECENSEMENT },
  };

  const relationAcademieFilter = {
    ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}),
  };

  // const relationBetweenResponsableAndFormateurPipelines = [
  //   {
  //     $match: {
  //       statut: { $ne: "non concerné" },
  //     },
  //   },

  //   { $project: { responsable: "$$ROOT" } },

  //   {
  //     $unwind: {
  //       path: "$responsable.etablissements_formateur",
  //       preserveNullAndEmptyArrays: false,
  //     },
  //   },

  //   {
  //     $match: {
  //       ...etablissementsFilter,
  //       ...academieFilter,
  //     },
  //   },

  //   {
  //     $lookup: {
  //       from: "users",
  //       let: {
  //         siret: "$responsable.etablissements_formateur.siret",
  //         uai: "$responsable.etablissements_formateur.uai",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $and: [
  //                 {
  //                   $or: [
  //                     { $and: [{ $ne: [null, "$$uai"] }, { $eq: ["$uai", "$$uai"] }] },
  //                     // { $and: [{ $ne: [null, "$$siret"] }, { $eq: ["$siret", "$$siret"] }] },
  //                   ],
  //                 },
  //                 { $eq: ["$type", "Formateur"] },
  //               ],
  //             },
  //           },
  //         },
  //       ],
  //       as: "formateur",
  //     },
  //   },

  //   {
  //     $unwind: {
  //       path: "$formateur",
  //       preserveNullAndEmptyArrays: false,
  //     },
  //   },
  // ];

  // const results = await Responsable.aggregate(
  //   [
  //     ...relationBetweenResponsableAndFormateurPipelines,

  //     {
  //       $match: {
  //         "responsable.etablissements_formateur.nombre_voeux": { $gt: 0 },
  //         "responsable.etablissements_formateur.voeux_date": { $ne: null },
  //       },
  //     },

  //     {
  //       $project: {
  //         responsableSiret: "$responsable.siret",
  //         formateurUai: "$formateur?.uai",

  //         etablissement: "$responsable.etablissements_formateur",

  //         downloads: {
  //           $switch: {
  //             branches: [
  //               {
  //                 case: {
  //                   $eq: ["$responsable.etablissements_formateur.diffusionAutorisee", true],
  //                 },
  //                 then: "$formateur?.voeux_telechargements_responsable",
  //               },
  //               {
  //                 case: "$responsable.voeux_telechargements_formateur",
  //                 then: "$responsable.voeux_telechargements_formateur",
  //               },
  //             ],
  //             default: [],
  //           },
  //         },
  //       },
  //     },

  //     {
  //       $unwind: {
  //         path: "$downloads",
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },

  //     {
  //       $match: {
  //         $or: [
  //           { downloads: { $exists: false } },
  //           { "downloads.uai": { $exists: true }, $expr: { $eq: ["$downloads.uai", "$formateurUai"] } },
  //           { "downloads.siret": { $exists: true }, $expr: { $eq: ["$downloads.siret", "$responsableSiret"] } },
  //         ],
  //       },
  //     },

  //     { $sort: { "download.date": -1 } },

  //     {
  //       $group: {
  //         _id: { siret: "$responsableSiret", uai: "$formateurUai" },
  //         responsableSiret: { $first: "$responsableSiret" },
  //         formateurUai: { $first: "$formateurUai" },
  //         etablissement: { $first: "$etablissement" },

  //         downloads: { $addToSet: "$downloads" },

  //         lastDownloadDate: { $last: "$downloads.date" },
  //       },
  //     },

  //     {
  //       $group: {
  //         _id: "$responsableSiret",
  //         siret: { $first: "$responsableSiret" },
  //         count: { $sum: 1 },

  //         allUais: {
  //           $addToSet: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
  //         },

  //         uaiDownloaded: {
  //           $addToSet: {
  //             $cond: {
  //               if: {
  //                 $and: [
  //                   { $ne: ["$downloads", []] },
  //                   { $ne: ["$lastDownloadDate", null] },
  //                   // { $ne: ["$etablissement.voeux_date", null] },
  //                   { $gt: ["$lastDownloadDate", "$etablissement.voeux_date"] },
  //                 ],
  //               },
  //               //                  then: {uai: "$formateur?.uai", voeuxDate: "$etablissement.voeux_date", lastDownloadDate: "$lastDownloadDate"},
  //               then: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
  //               else: "$$REMOVE",
  //             },
  //           },
  //         },

  //         uaiPartiallyDownloaded: {
  //           $addToSet: {
  //             $cond: {
  //               if: {
  //                 $and: [
  //                   { $ne: ["$downloads", []] },
  //                   { $ne: ["$lastDownloadDate", null] },
  //                   // { $ne: ["$etablissement.voeux_date", null] },
  //                   { $lte: ["$lastDownloadDate", "$etablissement.voeux_date"] },
  //                 ],
  //               },
  //               //                  then: {uai: "$formateur?.uai", voeuxDate: "$etablissement.voeux_date", lastDownloadDate: "$lastDownloadDate"},
  //               then: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
  //               else: "$$REMOVE",
  //             },
  //           },
  //         },

  //         uaiNotDownloaded: {
  //           $addToSet: {
  //             $cond: {
  //               if: {
  //                 $or: [
  //                   { $eq: ["$downloads", []] },
  //                   { $eq: ["$lastDownloadDate", null] },
  //                   // { $ne: ["$etablissement.voeux_date", null] },
  //                 ],
  //               },
  //               then: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
  //               else: "$$REMOVE",
  //             },
  //           },
  //         },
  //       },
  //     },
  //   ],
  //   { allowDiskUse: true, noCursorTimeout: true }
  // );

  return {
    // fullDownload: {
    //   nbResponsable: [
    //     ...new Set(
    //       results
    //         .map((result) => ({
    //           ...result,
    //           countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //         }))
    //         .filter(
    //           (result) =>
    //             result.countVoeux > 0 && result.allUais.length && result.uaiDownloaded.length === result.allUais.length
    //         )
    //         .map((result) => result.siret)
    //     ),
    //   ].length,

    //   nbFormateur: [
    //     ...new Set(
    //       results
    //         .map((result) => ({
    //           ...result,
    //           countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //         }))
    //         .filter(
    //           (result) =>
    //             result.countVoeux > 0 && result.allUais.length && result.uaiDownloaded.length === result.allUais.length
    //         )
    //         .flatMap((result) => result.uaiDownloaded)
    //         .map((value) => value.uai)
    //     ),
    //   ].length,

    //   nbVoeux: results
    //     .map((result) => ({
    //       ...result,
    //       countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //     }))
    //     .filter(
    //       (result) =>
    //         result.countVoeux > 0 && result.allUais.length && result.uaiDownloaded.length === result.allUais.length
    //     )
    //     .flatMap((result) => result.allUais)
    //     .map((value) => value.countVoeux)

    //     .reduce((a, b) => a + b, 0),
    // },

    // partialDownload: {
    //   nbResponsable: [
    //     ...new Set(
    //       results
    //         .map((result) => ({
    //           ...result,
    //           countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //         }))
    //         .filter(
    //           (result) =>
    //             result.countVoeux > 0 &&
    //             result.allUais.length &&
    //             result.allUais.length !== result.uaiNotDownloaded.length &&
    //             result.allUais.length !== result.uaiDownloaded.length
    //         )
    //         .map((result) => result.siret)
    //     ),
    //   ].length,

    //   nbFormateur: [
    //     ...new Set(
    //       results
    //         .map((result) => ({
    //           ...result,
    //           countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //         }))
    //         .filter(
    //           (result) =>
    //             result.countVoeux > 0 &&
    //             result.allUais.length &&
    //             result.allUais.length !== result.uaiNotDownloaded.length &&
    //             result.allUais.length !== result.uaiDownloaded.length
    //         )
    //         .flatMap((result) => result.allUais)
    //         .map((value) => value.uai)
    //     ),
    //   ].length,

    //   nbVoeux: results
    //     .map((result) => ({
    //       ...result,
    //       countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //     }))
    //     .filter(
    //       (result) =>
    //         result.countVoeux > 0 &&
    //         result.allUais.length &&
    //         result.allUais.length !== result.uaiNotDownloaded.length &&
    //         result.allUais.length !== result.uaiDownloaded.length
    //     )
    //     .flatMap((result) => result.allUais)
    //     .map((value) => value.countVoeux)
    //     .reduce((a, b) => a + b, 0),
    // },

    // noDownload: {
    //   nbResponsable: [
    //     ...new Set(
    //       results
    //         .map((result) => ({
    //           ...result,
    //           countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //         }))
    //         .filter(
    //           (result) =>
    //             result.countVoeux > 0 &&
    //             result.allUais.length &&
    //             result.uaiNotDownloaded.length === result.allUais.length
    //         )
    //         .map((result) => result.siret)
    //     ),
    //   ].length,

    //   nbFormateur: [
    //     ...new Set(
    //       results
    //         .map((result) => ({
    //           ...result,
    //           countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //         }))
    //         .filter(
    //           (result) =>
    //             result.countVoeux > 0 &&
    //             result.allUais.length &&
    //             result.uaiNotDownloaded.length === result.allUais.length
    //         )
    //         .flatMap((result) => result.uaiNotDownloaded)
    //         .map((value) => value.uai)
    //     ),
    //   ].length,

    //   nbVoeux: results
    //     .map((result) => ({
    //       ...result,
    //       countVoeux: result.allUais.reduce((a, b) => a + b.countVoeux, 0),
    //     }))
    //     .filter(
    //       (result) =>
    //         result.countVoeux > 0 && result.allUais.length && result.uaiNotDownloaded.length === result.allUais.length
    //     )
    //     .flatMap((result) => result.allUais)
    //     .map((value) => value.countVoeux)
    //     .reduce((a, b) => a + b, 0),
    // },

    // noVoeux: await promiseAllProps({
    //   nbResponsable: Responsable.aggregate([
    //     ...relationBetweenResponsableAndFormateurPipelines,

    //     {
    //       $project: {
    //         siret: "$responsable.siret",
    //         uai: "$formateur?.uai",
    //         countVoeux: "$responsable.etablissements_formateur.nombre_voeux",
    //       },
    //     },
    //     {
    //       $group: {
    //         _id: "$siret",
    //         uais: { $addToSet: "$uai" },
    //         totalVoeux: { $sum: "$countVoeux" },
    //       },
    //     },
    //     {
    //       $match: { totalVoeux: 0 },
    //     },

    //     { $group: { _id: null, total: { $sum: 1 } } },
    //   ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    //   nbFormateur: Responsable.aggregate([
    //     ...relationBetweenResponsableAndFormateurPipelines,

    //     {
    //       $project: {
    //         siret: "$responsable.siret",
    //         uai: "$formateur?.uai",
    //         countVoeux: "$responsable.etablissements_formateur.nombre_voeux",
    //       },
    //     },
    //     {
    //       $group: {
    //         _id: "$siret",
    //         uais: { $addToSet: "$uai" },
    //         totalVoeux: { $sum: "$countVoeux" },
    //       },
    //     },
    //     {
    //       $match: { totalVoeux: 0 },
    //     },
    //     { $unwind: "$uais" },
    //     { $group: { _id: "$uais" } },

    //     { $group: { _id: null, total: { $sum: 1 } } },
    //   ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    // }),

    fullDownload: await promiseAllProps({
      nbResponsable: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_responsable.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $eq: ["$nombre_voeux_restant", 0] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbFormateur: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $eq: ["$nombre_voeux_restant", 0] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbVoeux: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $eq: ["$nombre_voeux_restant", 0] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$nombre_voeux",
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    }),

    partialDownload: await promiseAllProps({
      nbResponsable: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_responsable.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux_restant", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux", "$nombre_voeux_restant"] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbFormateur: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux_restant", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux", "$nombre_voeux_restant"] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbVoeux: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux_restant", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux", "$nombre_voeux_restant"] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$nombre_voeux_restant",
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    }),

    noDownload: await promiseAllProps({
      nbResponsable: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_responsable.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux_restant", 0] },
              },
              {
                $expr: { $eq: ["$nombre_voeux", "$nombre_voeux_restant"] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbFormateur: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux_restant", 0] },
              },
              {
                $expr: { $eq: ["$nombre_voeux", "$nombre_voeux_restant"] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbVoeux: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $ne: ["$nombre_voeux", 0] },
              },
              {
                $expr: { $ne: ["$nombre_voeux_restant", 0] },
              },
              {
                $expr: { $eq: ["$nombre_voeux", "$nombre_voeux_restant"] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$nombre_voeux",
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    }),

    noVoeux: await promiseAllProps({
      nbResponsable: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_responsable.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $eq: ["$nombre_voeux", 0] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),

      nbFormateur: Relation.aggregate([
        {
          $match: {
            ...relationEtablissementsFilter,
            ...relationAcademieFilter,
          },
        },
        {
          $group: {
            _id: "$etablissement_formateur.siret",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: { $eq: ["$nombre_voeux", 0] },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: 1,
            },
          },
        },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    }),
  };
};

async function computeStats(options = {}) {
  const list = [
    { code: "ALL", query: {} },
    { code: "UNKNOWN", query: { "academie.code": { $exists: false } } },
    ...getAcademies().map((a) => ({ ...a, query: { "academie.code": a.code } })),
  ];

  function forAcademies(compute) {
    return Promise.all([
      ...list
        .filter((a) => (options.academies ? options.academies.includes(a.code) : true))
        .map(async (academie) => {
          return {
            code: academie.code,
            stats: await compute(academie.query),
          };
        }),
    ]);
  }

  return promiseAllProps({
    organismes: forAcademies(computeOrganismesStats),
    voeux: forAcademies(computeVoeuxStats),
    progresses: forAcademies(computeProgressesStats),
  });
}

module.exports = computeStats;
