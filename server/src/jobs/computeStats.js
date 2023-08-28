const { Gestionnaire, Formateur, Voeu } = require("../common/model");
const { promiseAllProps } = require("../common/utils/asyncUtils");
const { getAcademies } = require("../common/academies");
const logger = require("../common/logger");

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

  const etablissementsFilter = {
    // "etablissements.nombre_voeux": { $gt: 0 },
  };

  const academieFilter = {
    ...(filter?.["academie.code"] ? { "etablissements.academie.code": filter["academie.code"] } : {}),
  };

  return promiseAllProps({
    totalGestionnaire: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
        },
      },
      {
        $group: {
          _id: { siret: "$siret" },
          siret: { $first: "$siret" },
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

    totalGestionnaireAvecDelegation: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
          "etablissements.diffusionAutorisee": true,
        },
      },
      {
        $group: {
          _id: { siret: "$siret" },
          siret: { $first: "$siret" },
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

    totalGestionnaireMultiOrganismes: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,

          $expr: {
            $and: [
              {
                $ne: ["$uai", "$etablissements.uai"],
              },
              {
                $ne: ["$siret", "$etablissements.siret"],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: { siret: "$siret" },
          siret: { $first: "$siret" },
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

    totalFormateur: Formateur.countDocuments({ ...filter, etablissements: { $exists: true, $not: { $size: 0 } } }),

    totalFormateurAvecDelegation: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
          "etablissements.diffusionAutorisee": true,
        },
      },
      {
        $group: {
          _id: { uai: "$etablissements.uai" },
          uai: { $first: "$etablissements.uai" },
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

    totalAccueil: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
        },
      },
      {
        $group: {
          _id: { siret: "$siret", uai: "$etablissements.uai" },
          siret: { $first: "$siret" },
          uai: { $first: "$etablissements.uai" },
        },
      },
      {
        $lookup: {
          from: "voeux",
          let: {
            siret: "$siret",
            uai: "$uai",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_gestionnaire.siret", "$$siret"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai"] },
                  ],
                },
              },
            },
          ],
          as: "voeux",
        },
      },
      {
        $unwind: "$voeux",
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

    // enAttente: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "en attente",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    // }),

    // enAttenteAvecVoeux: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "en attente",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    //   "etablissements.voeux_date": { $exists: true },
    // }),

    // confirmés: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "confirmé",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    // }),

    // confirmésAvecVoeux: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "confirmé",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    //   "etablissements.voeux_date": { $exists: true },
    // }),

    // activés: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "activé",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    // }),

    // activésAvecVoeux: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "activé",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    //   "etablissements.voeux_date": { $exists: true },
    // }),

    // téléchargésVoeux: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: "activé",
    //   etablissements: { $exists: true, $not: { $size: 0 } },
    //   "etablissements.voeux_date": { $exists: true },
    //   voeux_telechargements: { $exists: true, $not: { $size: 0 } },
    // }),

    // téléchargésVoeuxTotal: (async () => {
    //   const cfas = await Gestionnaire.find({
    //     ...filter,
    //     statut: "activé",
    //     etablissements: { $exists: true, $not: { $size: 0 } },
    //     "etablissements.voeux_date": { $exists: true },
    //     voeux_telechargements: { $exists: true, $not: { $size: 0 } },
    //   });

    //   return cfas.filter((cfa) => areTelechargementsTotal(cfa.etablissements, cfa.voeux_telechargements)).length;
    // })(),

    // téléchargésVoeuxPartiel: (async () => {
    //   const cfas = await Gestionnaire.find({
    //     ...filter,
    //     statut: "activé",
    //     etablissements: { $exists: true, $not: { $size: 0 } },
    //     "etablissements.voeux_date": { $exists: true },
    //     voeux_telechargements: { $exists: true, $not: { $size: 0 } },
    //   });

    //   return cfas.filter((cfa) => areTelechargementsPartiel(cfa.etablissements, cfa.voeux_telechargements)).length;
    // })(),

    // téléchargésVoeuxAucun: (async () => {
    //   const cfas = await Gestionnaire.find({
    //     ...filter,
    //     statut: "activé",
    //     etablissements: { $exists: true, $not: { $size: 0 } },
    //     "etablissements.voeux_date": { $exists: true },
    //   });

    //   return cfas.filter((cfa) => areTelechargementsAucun(cfa.etablissements, cfa.voeux_telechargements)).length;
    // })(),

    // désinscrits: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: { $ne: "non concerné" },
    //   $or: [{ unsubscribe: true }, { "emails.error.type": { $eq: "blocked" } }],
    // }),

    // désinscritsAvecVoeux: Gestionnaire.countDocuments({
    //   ...filter,
    //   "etablissements.voeux_date": { $exists: true },
    //   statut: { $ne: "non concerné" },
    //   $or: [{ unsubscribe: true }, { "emails.error.type": { $eq: "blocked" } }],
    // }),

    // injoinables: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: { $ne: "non concerné" },
    //   $and: [{ "emails.error": { $exists: true } }, { "emails.error.type": { $ne: "blocked" } }],
    // }),

    // injoinablesAvecVoeux: Gestionnaire.countDocuments({
    //   ...filter,
    //   statut: { $ne: "non concerné" },
    //   "etablissements.voeux_date": { $exists: true },
    //   $and: [{ "emails.error": { $exists: true } }, { "emails.error.type": { $ne: "blocked" } }],
    // }),
  });
};

const computeVoeuxStats = async (filter = {}) => {
  const uais = (await Formateur.find(filter).select({ uai: 1 }))
    .map((formateur) => formateur.uai)
    .filter((uai) => !UAIS_RECENSEMENT.includes(uai));

  const gestionnaires = await Gestionnaire.aggregate([{ $project: { siret: "$siret" } }]);
  const formateurs = await Formateur.aggregate([{ $project: { uai: "$uai" } }]);

  const voeuxFilter = {
    "etablissement_accueil.uai": { $nin: UAIS_RECENSEMENT },
  };

  const etablissementsFilter = {
    // "etablissements.nombre_voeux": { $gt: 0 },
  };

  const academieFilter = {
    ...(filter?.["academie.code"] ? { "etablissements.academie.code": filter["academie.code"] } : {}),
  };

  return promiseAllProps({
    total: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
        },
      },
      {
        $group: {
          _id: { siret: "$siret", uai: "$etablissements.uai" },
          siret: { $first: "$siret" },
          uai: { $first: "$etablissements.uai" },
        },
      },
      {
        $lookup: {
          from: "voeux",
          let: {
            siret: "$siret",
            uai: "$uai",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_gestionnaire.siret", "$$siret"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai"] },
                  ],
                },
              },
            },
            {
              $count: "nbVoeux",
            },
          ],
          as: "res",
        },
      },
      {
        $unwind: "$res",
      },
      {
        $project: {
          nbVoeux: "$res.nbVoeux",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$nbVoeux",
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    apprenants: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
        },
      },
      {
        $group: {
          _id: { siret: "$siret", uai: "$etablissements.uai" },
          siret: { $first: "$siret" },
          uai: { $first: "$etablissements.uai" },
        },
      },
      {
        $lookup: {
          from: "voeux",
          let: {
            siret: "$siret",
            uai: "$uai",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_gestionnaire.siret", "$$siret"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai"] },
                  ],
                },
              },
            },
          ],
          as: "voeux",
        },
      },
      {
        $unwind: "$voeux",
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

    gestionnairesInconnus: Voeu.aggregate([
      {
        $match: {
          "etablissement_gestionnaire.siret": {
            $nin: gestionnaires.map((gestionnaire) => gestionnaire.siret),
          },
          ...(filter?.["academie.code"] ? { "etablissement_accueil.academie.code": filter["academie.code"] } : {}),
        },
      },
      {
        $group: {
          _id: "$etablissement_gestionnaire.siret",
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
            $nin: formateurs.map((formateur) => formateur.uai),
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
          ...(filter?.["academie.code"] ? { "etablissements.academie.code": filter["academie.code"] } : {}),
          $or: [
            { "etablissement_gestionnaire.siret": { $exists: false } },
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

    nbVoeuxDiffusésGestionnaire: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $match: { "voeux_telechargements.0": { $exists: true } },
      },
      {
        $unwind: "$voeux_telechargements",
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          "etablissements.diffusionAutorisee": false,
          "etablissements.uai": { $in: uais },
          $expr: {
            $eq: ["$etablissements.uai", "$voeux_telechargements.uai"],
          },
          ...etablissementsFilter,
          ...academieFilter,
        },
      },
      {
        $sort: {
          siret: 1,
          "voeux_telechargements.uai": 1,
          "voeux_telechargements.date": 1,
          "etablissements.voeux_date": 1,
        },
      },
      {
        $group: {
          _id: { siret: "$siret", uai: "$etablissements.uai" },
          siret: { $first: "$siret" },
          uai: { $first: "$etablissements.uai" },
          downloadDates: { $addToSet: "$voeux_telechargements.date" },
          importDates: { $addToSet: "$etablissements.voeux_date" },
          downloadDate: { $last: "$voeux_telechargements.date" },
          importDate: { $first: "$etablissements.voeux_date" },
        },
      },
      {
        $lookup: {
          from: "voeux",
          let: {
            siret: "$siret",
            uai: "$uai",
            downloadDate: "$downloadDate",
          },
          pipeline: [
            {
              $match: {
                ...voeuxFilter,
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_gestionnaire.siret", "$$siret"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai"] },
                    { $gt: ["$$downloadDate", { $first: "$_meta.import_dates" }] },
                  ],
                },
              },
            },
            {
              $count: "nbVoeux",
            },
          ],
          as: "res",
        },
      },
      {
        $unwind: "$res",
      },
      {
        $project: {
          nbVoeux: "$res.nbVoeux",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$nbVoeux",
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),

    nbVoeuxDiffusésFormateur: Gestionnaire.aggregate([
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },
      {
        $unwind: "$etablissements",
      },
      {
        $match: {
          "etablissements.diffusionAutorisee": true,
          "etablissements.uai": { $in: uais },
          ...etablissementsFilter,
          ...academieFilter,
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            uai: "$etablissements.uai",
          },
          pipeline: [
            {
              $match: {
                type: "Formateur",
                $expr: { $eq: ["$uai", "$$uai"] },
              },
            },
          ],
          as: "formateur",
        },
      },
      {
        $unwind: "$formateur",
      },
      {
        $unwind: "$formateur.etablissements",
      },
      {
        $unwind: "$formateur.voeux_telechargements",
      },
      {
        $match: {
          $expr: {
            $eq: ["$formateur.etablissements.siret", "$formateur.voeux_telechargements.siret"],
          },
        },
      },
      {
        $sort: {
          "formateur.uai": 1,
          "formateur.voeux_telechargements.siret": 1,
          "formateur.voeux_telechargements.date": 1,
          "etablissements.voeux_date": 1,
        },
      },
      {
        $group: {
          _id: { uai: "$formateur.uai", siret: "$siret" },
          uai: { $first: "$formateur.uai" },
          siret: { $first: "$siret" },
          downloadDates: { $addToSet: "$formateur.voeux_telechargements.date" },
          importDates: { $addToSet: "$etablissements.voeux_date" },
          downloadDate: { $last: "$formateur.voeux_telechargements.date" },
          importDate: { $first: "$etablissements.voeux_date" },
        },
      },
      {
        $lookup: {
          from: "voeux",
          let: {
            siret: "$siret",
            uai: "$uai",
            downloadDate: "$downloadDate",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_gestionnaire.siret", "$$siret"] },
                    { $eq: ["$etablissement_formateur.uai", "$$uai"] },
                    { $gt: ["$$downloadDate", { $first: "$_meta.import_dates" }] },
                  ],
                },
              },
            },
            {
              $count: "nbVoeux",
            },
          ],
          as: "res",
        },
      },
      {
        $unwind: "$res",
      },
      {
        $project: {
          nbVoeux: "$res.nbVoeux",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$nbVoeux",
          },
        },
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),
  });
};

const computeProgressesStats = async (filter = {}) => {
  const etablissementsFilter = {
    // "gestionnaire.etablissements.nombre_voeux": { $gt: 0 },
  };

  const academieFilter = {
    ...(filter?.["academie.code"] ? { "gestionnaire.etablissements.academie.code": filter["academie.code"] } : {}),
  };

  const results = await Gestionnaire.aggregate(
    [
      {
        $match: {
          statut: { $ne: "non concerné" },
        },
      },

      { $project: { gestionnaire: "$$ROOT" } },

      {
        $unwind: {
          path: "$gestionnaire.etablissements",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          ...etablissementsFilter,
          ...academieFilter,
        },
      },

      {
        $lookup: {
          from: "users",
          let: {
            siret: "$gestionnaire.siret",
            uai: "$gestionnaire.etablissements.uai",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [{ $eq: ["$uai", "$$uai"] }, { $eq: ["$siret", "$$siret"] }],
                    },
                    { $eq: ["$type", "Formateur"] },
                  ],
                },
              },
            },
          ],
          as: "formateur",
        },
      },

      {
        $unwind: {
          path: "$formateur",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          gestionnaireSiret: "$gestionnaire.siret",
          formateurUai: "$formateur.uai",

          etablissement: "$gestionnaire.etablissements",

          downloads: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$gestionnaire.etablissements.diffusionAutorisee", true],
                  },
                  then: "$formateur.voeux_telechargements",
                },
                {
                  case: "$gestionnaire.voeux_telechargements",
                  then: "$gestionnaire.voeux_telechargements",
                },
              ],
              default: [],
            },
          },
        },
      },

      {
        $unwind: {
          path: "$downloads",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          $or: [
            { downloads: { $exists: false } },
            { "downloads.uai": { $exists: true }, $expr: { $eq: ["$downloads.uai", "$formateurUai"] } },
            { "downloads.siret": { $exists: true }, $expr: { $eq: ["$downloads.siret", "$gestionnaireSiret"] } },
          ],
        },
      },

      { $sort: { "download.date": -1 } },

      {
        $group: {
          _id: { siret: "$gestionnaireSiret", uai: "$formateurUai" },
          gestionnaireSiret: { $first: "$gestionnaireSiret" },
          formateurUai: { $first: "$formateurUai" },
          etablissement: { $first: "$etablissement" },

          downloads: { $addToSet: "$downloads" },

          downloadDate: { $last: "$downloads.date" },
        },
      },

      // { $match: { "etablissement.voeux_date": { $exists: true } } },

      {
        $group: {
          _id: "$gestionnaireSiret",
          siret: { $first: "$gestionnaireSiret" },
          count: { $sum: 1 },

          allUais: {
            $addToSet: "$formateurUai",
          },

          uaiDownloaded: {
            $addToSet: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$downloads", []] },
                    { $gt: ["$downloadDate", "$etablissement.voeux_date"] },
                    { $ne: ["$etablissement.voeux_date", null] },
                  ],
                },
                //                  then: {uai: "$formateur.uai", voeuxDate: "$etablissement.voeux_date", downloadDate: "$downloadDate"},
                then: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
                else: "$$REMOVE",
              },
            },
          },

          uaiPartiallyDownloaded: {
            $addToSet: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$downloads", []] },
                    { $lte: ["$downloadDate", "$etablissement.voeux_date"] },
                    // { $ne: ["$etablissement.voeux_date", null] },
                  ],
                },
                //                  then: {uai: "$formateur.uai", voeuxDate: "$etablissement.voeux_date", downloadDate: "$downloadDate"},
                then: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
                else: "$$REMOVE",
              },
            },
          },

          uaiNotDownloaded: {
            $addToSet: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$downloads", []] },
                    // { $ne: ["$etablissement.voeux_date", null] }
                  ],
                },
                then: { uai: "$formateurUai", countVoeux: "$etablissement.nombre_voeux" },
                else: "$$REMOVE",
              },
            },
          },
        },
      },
    ],
    { allowDiskUse: true, noCursorTimeout: true }
  );

  logger.error({
    fullDownload: {
      nbGestionnaire: [
        ...new Set(
          results.filter((result) => result.uaiDownloaded.length === result.allUais.length).map((result) => result._id)
        ),
      ],

      nbFormateur: [
        ...new Set(results.filter((result) => result.uaiDownloaded.length).flatMap((result) => result.uaiDownloaded)),
      ],
    },

    noDownload: {
      nbGestionnaire: [
        ...new Set(
          results
            .filter(
              (result) =>
                result.uaiNotDownloaded.length && !result.uaiDownloaded.length && !result.uaiPartiallyDownloaded.length
            )
            .map((result) => result._id)
        ),
      ],

      nbFormateur: [
        ...new Set(
          results.filter((result) => result.uaiNotDownloaded.length).flatMap((result) => result.uaiNotDownloaded)
        ),
      ].length,
    },

    partialDownload: {
      nbGestionnaire: [
        ...new Set(results.filter((result) => result.uaiPartiallyDownloaded.length).map((result) => result._id)),
      ],

      nbFormateur: [
        ...new Set(
          results
            .filter((result) => result.uaiPartiallyDownloaded.length)
            .flatMap((result) => result.uaiPartiallyDownloaded)
        ),
      ],
    },

    noVoeux: await promiseAllProps({
      nbGestionnaire: Gestionnaire.aggregate([
        {
          $match: {
            statut: { $ne: "non concerné" },
          },
        },

        { $project: { gestionnaire: "$$ROOT" } },

        {
          $unwind: "$gestionnaire.etablissements",
        },

        {
          $match: {
            ...etablissementsFilter,
            ...academieFilter,
          },
        },

        {
          $lookup: {
            from: "users",
            let: {
              siret: "$gestionnaire.siret",
              uai: "$gestionnaire.etablissements.uai",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [{ $eq: ["$uai", "$$uai"] }, { $eq: ["$siret", "$$siret"] }],
                      },
                      { $eq: ["$type", "Formateur"] },
                    ],
                  },
                },
              },
            ],
            as: "formateur",
          },
        },

        {
          $project: {
            siret: "$gestionnaire.siret",
            uai: "$formateur.uai",
            countVoeux: "$gestionnaire.etablissements.nombre_voeux",
          },
        },
        {
          $group: {
            _id: "$siret",
            totalVoeux: { $sum: "$countVoeux" },
          },
        },
        {
          $match: { totalVoeux: 0 },
        },
      ]),
      nbFormateur: Gestionnaire.aggregate([
        {
          $match: {
            statut: { $ne: "non concerné" },
          },
        },

        { $project: { gestionnaire: "$$ROOT" } },

        {
          $unwind: "$gestionnaire.etablissements",
        },

        {
          $match: {
            ...etablissementsFilter,
            ...academieFilter,
          },
        },

        {
          $lookup: {
            from: "users",
            let: {
              siret: "$gestionnaire.siret",
              uai: "$gestionnaire.etablissements.uai",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [{ $eq: ["$uai", "$$uai"] }, { $eq: ["$siret", "$$siret"] }],
                      },
                      { $eq: ["$type", "Formateur"] },
                    ],
                  },
                },
              },
            ],
            as: "formateur",
          },
        },

        {
          $project: {
            siret: "$gestionnaire.siret",
            uai: "$formateur.uai",
            countVoeux: "$gestionnaire.etablissements.nombre_voeux",
          },
        },
        {
          $group: {
            _id: "$uai",
            totalVoeux: { $sum: "$countVoeux" },
          },
        },
        {
          $match: { totalVoeux: 0 },
        },
      ]),
    }),
  });

  return {
    fullDownload: {
      nbGestionnaire: [
        ...new Set(
          results
            .filter((result) => result.uaiDownloaded.length === result.allUais.length)
            .map((result) => result.siret)
        ),
      ].length,

      nbFormateur: [
        ...new Set(
          results
            .filter((result) => result.uaiDownloaded.length)
            .flatMap((result) => result.uaiDownloaded.map((value) => value.uai))
        ),
      ].length,

      nbVoeux: results
        .filter((result) => result.uaiDownloaded.length)
        .flatMap((result) => result.uaiDownloaded.map((value) => value.countVoeux))
        .reduce((a, b) => a + b, 0),
    },

    noDownload: {
      nbGestionnaire: [
        ...new Set(
          results
            .filter(
              (result) =>
                result.uaiNotDownloaded.length && !result.uaiDownloaded.length && !result.uaiPartiallyDownloaded.length
            )
            .map((result) => result.siret)
        ),
      ].length,

      nbFormateur: [
        ...new Set(
          results
            .filter((result) => result.uaiNotDownloaded.length)
            .flatMap((result) => result.uaiNotDownloaded.map((value) => value.uai))
        ),
      ].length,

      nbVoeux: results
        .filter((result) => result.uaiNotDownloaded.length)
        .flatMap((result) => result.uaiNotDownloaded.map((value) => value.countVoeux))
        .reduce((a, b) => a + b, 0),
    },

    partialDownload: {
      nbGestionnaire: [
        ...new Set(results.filter((result) => result.uaiPartiallyDownloaded.length).map((result) => result.siret)),
      ].length,

      nbFormateur: [
        ...new Set(
          results
            .filter((result) => result.uaiPartiallyDownloaded.length)
            .flatMap((result) => result.uaiPartiallyDownloaded.map((value) => value.uai))
        ),
      ].length,

      nbVoeux: results
        .filter((result) => result.uaiPartiallyDownloaded.length)
        .flatMap((result) => result.uaiPartiallyDownloaded.map((value) => value.countVoeux))
        .reduce((a, b) => a + b, 0),
    },

    noVoeux: await promiseAllProps({
      nbGestionnaire: Gestionnaire.aggregate([
        {
          $match: {
            statut: { $ne: "non concerné" },
          },
        },

        { $project: { gestionnaire: "$$ROOT" } },

        {
          $unwind: {
            path: "$gestionnaire.etablissements",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $match: {
            ...etablissementsFilter,
            ...academieFilter,
          },
        },

        {
          $lookup: {
            from: "users",
            let: {
              siret: "$gestionnaire.siret",
              uai: "$gestionnaire.etablissements.uai",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [{ $eq: ["$uai", "$$uai"] }, { $eq: ["$siret", "$$siret"] }],
                      },
                      { $eq: ["$type", "Formateur"] },
                    ],
                  },
                },
              },
            ],
            as: "formateur",
          },
        },

        {
          $unwind: {
            path: "$formateur",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            siret: "$gestionnaire.siret",
            uai: "$formateur.uai",
            countVoeux: "$gestionnaire.etablissements.nombre_voeux",
          },
        },
        {
          $group: {
            _id: "$siret",
            totalVoeux: { $sum: "$countVoeux" },
          },
        },
        {
          $match: { totalVoeux: 0 },
        },

        { $group: { _id: null, total: { $sum: 1 } } },
      ]).then((res) => (res.length > 0 ? res[0].total : 0)),
      nbFormateur: Gestionnaire.aggregate([
        {
          $match: {
            statut: { $ne: "non concerné" },
          },
        },

        { $project: { gestionnaire: "$$ROOT" } },

        {
          $unwind: {
            path: "$gestionnaire.etablissements",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $match: {
            ...etablissementsFilter,
            ...academieFilter,
          },
        },

        {
          $lookup: {
            from: "users",
            let: {
              siret: "$gestionnaire.siret",
              uai: "$gestionnaire.etablissements.uai",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [{ $eq: ["$uai", "$$uai"] }, { $eq: ["$siret", "$$siret"] }],
                      },
                      { $eq: ["$type", "Formateur"] },
                    ],
                  },
                },
              },
            ],
            as: "formateur",
          },
        },

        {
          $unwind: {
            path: "$formateur",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            siret: "$gestionnaire.siret",
            uai: "$formateur.uai",
            countVoeux: "$gestionnaire.etablissements.nombre_voeux",
          },
        },
        {
          $group: {
            _id: "$uai",
            totalVoeux: { $sum: "$countVoeux" },
          },
        },
        {
          $match: { totalVoeux: 0 },
        },

        { $group: { _id: null, total: { $sum: 1 } } },
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
