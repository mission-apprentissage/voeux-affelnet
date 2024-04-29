const { Responsable, Formateur, Voeu, Relation, Delegue } = require("../common/model");
const { promiseAllProps } = require("../common/utils/asyncUtils");
const { getAcademies } = require("../common/academies");
const { UserType } = require("../common/constants/UserType");

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
    "etablissement_formateur.siret": { $nin: UAIS_RECENSEMENT },
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
          siret: { $first: "$etablissement_responsable.siret" },
          uais: { $addToSet: "$etablissement_formateur.uai" },
        },
      },
      { $match: { "uais.1": { $exists: true } } },
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
          _id: "$etablissement_formateur.uai",
          uai: { $first: "$etablissement_formateur.uai" },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$etablissement_formateur.uai",
          uai: { $first: "$etablissement_formateur.uai" },
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
            uai_formateur: "$etablissement_formateur.uai",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
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

  const responsables = await Responsable.aggregate([{ $project: { siret: "$siret" } }]);
  const formateurs = await Formateur.aggregate([{ $project: { uai: "$uai" } }]);

  const voeuxFilter = {
    "etablissement_accueil.uai": { $nin: UAIS_RECENSEMENT },
  };

  const relationEtablissementsFilter = {
    "etablissement_responsable.siret": { $ne: SIRET_RECENSEMENT },
    "etablissement_formateur.siret": { $nin: UAIS_RECENSEMENT },
  };

  const relationAcademieFilter = {
    ...(filter?.["academie.code"] ? { "academie.code": filter["academie.code"] } : {}),
  };

  return promiseAllProps({
    total: Relation.aggregate([
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
            uai_formateur: "$etablissement_formateur.uai",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
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
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

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
            uai_formateur: "$etablissement_formateur.uai",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
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
          "etablissement_responsable.siret": {
            $nin: responsables.map((responsable) => responsable.siret),
          },
          ...(filter?.["academie.code"] ? { "etablissement_accueil.academie.code": filter["academie.code"] } : {}),
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

    formateursInconnus: Voeu.aggregate([
      {
        $match: {
          "etablissement_formateur.uai": {
            $nin: formateurs.map((formateur) => formateur?.uai),
          },
          ...(filter?.["academie.code"] ? { "etablissement_accueil.academie.code": filter["academie.code"] } : {}),
        },
      },
      {
        $group: {
          _id: "$etablissement_formateur.uai",
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    nbVoeuxNonDiffusable: Voeu.aggregate([
      {
        $match: {
          ...(filter?.["academie.code"] ? { "etablissement_accueil.academie.code": filter["academie.code"] } : {}),
          $or: [
            { "etablissement_responsable.siret": { $exists: false } },
            { "etablissement_formateur.uai": { $exists: false } },
          ],
          "etablissement_accueil.uai": { $nin: UAIS_RECENSEMENT },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
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
          path: "$delegue",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { delegue: null } },

      // TDDO : Comparer la date de (premier / dernier ??) import de chaque voeux avec la date de dernier téléchargement

      // {
      //   $lookup: {
      //     from: Voeu.collection.name,
      //     let: {
      //       siret_responsable: "$etablissement_responsable.siret",
      //       uai_formateur: "$etablissement_formateur.uai",
      //     },
      //     pipeline: [
      //       {
      //         $match: {
      //           ...voeuxFilter,
      //           $expr: {
      //             $and: [
      //               { $eq: ["$etablissement_responsable.siret", "$$siret_responsable"] },
      //               { $eq: ["$etablissement_formateur.uai", "$$uai_formateur"] },
      //             ],
      //           },
      //         },
      //       },
      //     ],
      //     as: "voeux",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$voeux",
      //     preserveNullAndEmptyArrays: false,
      //   },
      // },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    // nbVoeuxDiffusésResponsable: Responsable.aggregate([
    //   {
    //     $match: {
    //       statut: { $ne: "non concerné" },
    //     },
    //   },
    //   {
    //     $match: { "voeux_telechargements.0": { $exists: true } },
    //   },
    //   {
    //     $unwind: "$voeux_telechargements",
    //   },
    //   {
    //     $unwind: "$etablissements",
    //   },
    //   {
    //     $match: {
    //       "etablissements.diffusionAutorisee": false,
    //       "etablissements.uai": { $in: uais },
    //       $expr: {
    //         $eq: ["$etablissements.uai", "$voeux_telechargements.uai"],
    //       },
    //       ...etablissementsFilter,
    //       ...academieFilter,
    //     },
    //   },
    //   {
    //     $sort: {
    //       siret: 1,
    //       "voeux_telechargements.uai": 1,
    //       "voeux_telechargements.date": 1,
    //       "etablissements.voeux_date": 1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: { siret: "$siret", uai: "$etablissements.uai" },
    //       siret: { $first: "$siret" },
    //       uai: { $first: "$etablissements.uai" },
    //       lastDownloadDates: { $addToSet: "$voeux_telechargements.date" },
    //       importDates: { $addToSet: "$etablissements.voeux_date" },
    //       lastDownloadDate: { $last: "$voeux_telechargements.date" },
    //       importDate: { $first: "$etablissements.voeux_date" },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "voeux",
    //       let: {
    //         siret: "$siret",
    //         uai: "$uai",
    //         lastDownloadDate: "$lastDownloadDate",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             ...voeuxFilter,
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$etablissement_responsable.siret", "$$siret"] },
    //                 { $eq: ["$etablissement_formateur.uai", "$$uai"] },
    //                 { $gt: ["$$lastDownloadDate", { $first: "$_meta.import_dates" }] },
    //               ],
    //             },
    //           },
    //         },
    //         {
    //           $count: "nbVoeux",
    //         },
    //       ],
    //       as: "res",
    //     },
    //   },
    //   {
    //     $unwind: "$res",
    //   },
    //   {
    //     $project: {
    //       nbVoeux: "$res.nbVoeux",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       total: {
    //         $sum: "$nbVoeux",
    //       },
    //     },
    //   },
    // ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    // nbVoeuxDiffusésFormateur: Responsable.aggregate([
    //   {
    //     $match: {
    //       statut: { $ne: "non concerné" },
    //     },
    //   },
    //   {
    //     $unwind: "$etablissements",
    //   },
    //   {
    //     $match: {
    //       "etablissements.diffusionAutorisee": true,
    //       "etablissements.uai": { $in: uais },
    //       ...etablissementsFilter,
    //       ...academieFilter,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       let: {
    //         uai: "$etablissements.uai",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             type: "Formateur",
    //             $expr: { $eq: ["$uai", "$$uai"] },
    //           },
    //         },
    //       ],
    //       as: "formateur",
    //     },
    //   },
    //   {
    //     $unwind: "$formateur",
    //   },
    //   {
    //     $unwind: "$formateur?.etablissements_responsable",
    //   },
    //   {
    //     $unwind: "$formateur?.voeux_telechargements_responsable",
    //   },
    //   {
    //     $match: {
    //       $expr: {
    //         $eq: ["$formateur?.etablissements_responsable.siret", "$formateur?.voeux_telechargements_responsable.siret"],
    //       },
    //     },
    //   },
    //   {
    //     $sort: {
    //       "formateur?.uai": 1,
    //       "formateur?.voeux_telechargements_responsable.siret": 1,
    //       "formateur?.voeux_telechargements_responsable.date": 1,
    //       "etablissements.voeux_date": 1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: { uai: "$formateur?.uai", siret: "$siret" },
    //       uai: { $first: "$formateur?.uai" },
    //       siret: { $first: "$siret" },
    //       lastDownloadDates: { $addToSet: "$formateur?.voeux_telechargements_responsable.date" },
    //       importDates: { $addToSet: "$etablissements.voeux_date" },
    //       lastDownloadDate: { $last: "$formateur?.voeux_telechargements_responsable.date" },
    //       importDate: { $first: "$etablissements.voeux_date" },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "voeux",
    //       let: {
    //         siret: "$siret",
    //         uai: "$uai",
    //         lastDownloadDate: "$lastDownloadDate",
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$etablissement_responsable.siret", "$$siret"] },
    //                 { $eq: ["$etablissement_formateur.uai", "$$uai"] },
    //                 { $gt: ["$$lastDownloadDate", { $first: "$_meta.import_dates" }] },
    //               ],
    //             },
    //           },
    //         },
    //         {
    //           $count: "nbVoeux",
    //         },
    //       ],
    //       as: "res",
    //     },
    //   },
    //   {
    //     $unwind: "$res",
    //   },
    //   {
    //     $project: {
    //       nbVoeux: "$res.nbVoeux",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       total: {
    //         $sum: "$nbVoeux",
    //       },
    //     },
    //   },
    // ]).then((res) => (res.length > 0 ? res[0].total : 0)),
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
            nombre_voeux: { $ne: 0 },
            nombre_voeux_restant: 0,
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
            _id: "$etablissement_formateur.uai",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        {
          $match: {
            nombre_voeux: { $ne: 0 },
            nombre_voeux_restant: 0,
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

      // nbVoeux:
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
        { $match: { nombre_voeux: { $nin: [0, "$nombre_voeux_restant"] }, nombre_voeux_restant: { $ne: 0 } } },
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
            _id: "$etablissement_formateur.uai",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        { $match: { nombre_voeux: { $nin: [0, "$nombre_voeux_restant"] }, nombre_voeux_restant: { $ne: 0 } } },
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
        { $match: { nombre_voeux: { $eq: "$nombre_voeux_restant", $ne: 0 } } },
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
            _id: "$etablissement_formateur.uai",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        { $match: { nombre_voeux: { $eq: "$nombre_voeux_restant", $ne: 0 } } },
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
        { $match: { nombre_voeux: 0 } },
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
            _id: "$etablissement_formateur.uai",
            nombre_voeux: { $sum: "$nombre_voeux" },
            nombre_voeux_restant: { $sum: "$nombre_voeux_restant" },
          },
        },
        { $match: { nombre_voeux: 0 } },
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
