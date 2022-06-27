const { Cfa, Voeu } = require("../common/model");
const { promiseAllProps } = require("../common/utils/asyncUtils");
const { getAcademies } = require("../common/academies");

function countVoeux(query) {
  return Cfa.aggregate([
    { $match: { ...query, "voeux_telechargements.0": { $exists: true } } },
    {
      $unwind: "$voeux_telechargements",
    },
    {
      $lookup: {
        from: "voeux",
        let: {
          voeux_telechargements: "$voeux_telechargements",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$etablissement_accueil.uai", "$$voeux_telechargements.uai"] },
                  { $lt: [{ $last: "$_meta.import_dates" }, "$$voeux_telechargements.date"] },
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
      $group: {
        _id: null,
        total: {
          $sum: "$res.nbVoeux",
        },
      },
    },
  ]).then((res) => (res.length > 0 ? res[0].total : 0));
}
function computeCfasStats(filter = {}) {
  return promiseAllProps({
    total: Cfa.countDocuments(filter),
    enAttente: Cfa.countDocuments({ ...filter, statut: "en attente" }),
    enAttenteAvecVoeux: Cfa.countDocuments({
      ...filter,
      statut: "en attente",
      "etablissements.voeux_date": { $exists: true },
    }),
    confirmés: Cfa.countDocuments({ ...filter, statut: "confirmé" }),
    confirmésAvecVoeux: Cfa.countDocuments({
      ...filter,
      statut: "confirmé",
      "etablissements.voeux_date": { $exists: true },
    }),
    téléchargésVoeux: Cfa.countDocuments({
      ...filter,
      voeux_telechargements: { $exists: true, $not: { $size: 0 } },
    }),
    désinscrits: Cfa.countDocuments({
      ...filter,
      statut: { $ne: "non concerné" },
      $or: [{ unsubscribe: true }, { "emails.error.type": { $eq: "blocked" } }],
    }),
    désinscritsAvecVoeux: Cfa.countDocuments({
      ...filter,
      "etablissements.voeux_date": { $exists: true },
      statut: { $ne: "non concerné" },
      $or: [{ unsubscribe: true }, { "emails.error.type": { $eq: "blocked" } }],
    }),
    injoinables: Cfa.countDocuments({
      ...filter,
      statut: { $ne: "non concerné" },
      $and: [{ "emails.error": { $exists: true } }, { "emails.error.type": { $ne: "blocked" } }],
    }),
    injoinablesAvecVoeux: Cfa.countDocuments({
      ...filter,
      statut: { $ne: "non concerné" },
      "etablissements.voeux_date": { $exists: true },
      $and: [{ "emails.error": { $exists: true } }, { "emails.error.type": { $ne: "blocked" } }],
    }),
    activés: Cfa.countDocuments({ ...filter, statut: "activé" }),
  });
}

async function computeVoeuxStats(filter = {}) {
  const etablissements = await Cfa.aggregate([
    { $match: { ...filter } },
    { $unwind: "$etablissements" },
    { $project: { uai: "$etablissements.uai" } },
  ]);

  return promiseAllProps({
    total: Voeu.countDocuments(filter),
    apprenants: Voeu.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$apprenant.ine",
          count: { $sum: 1 },
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => {
      return res.length > 0 ? res[0].total : 0;
    }),
    cfasInconnus: Voeu.aggregate([
      {
        $match: {
          ...filter,
          "etablissement_accueil.uai": {
            $nin: etablissements.map((e) => e.uai),
          },
        },
      },
      {
        $group: {
          _id: "$etablissement_accueil.uai",
        },
      },
      {
        $count: "total",
      },
    ]).then((res) => (res.length > 0 ? res[0].total : 0)),
    nbVoeuxDiffusés: countVoeux(filter),
  });
}

function computeEmailsStats(filter = {}) {
  return Cfa.aggregate([
    {
      $match: { ...filter },
    },
    { $unwind: "$emails" },
    {
      $addFields: {
        templateName: { $arrayElemAt: [{ $split: ["$emails.templateName", "_"] }, 0] },
      },
    },
    {
      $group: {
        _id: "$templateName",
        nbEnvoyés: { $sum: 1 },
        nbOuverts: {
          $sum: {
            $cond: {
              if: { $ifNull: ["$emails.openDate", false] },
              then: 1,
              else: 0,
            },
          },
        },
        nbRelances: {
          $sum: {
            $cond: {
              if: { $gte: [{ $size: "$emails.sendDates" }, 2] },
              then: 1,
              else: 0,
            },
          },
        },
        nbErreurs: {
          $sum: {
            $cond: {
              if: { $ifNull: ["$emails.error", false] },
              then: 1,
              else: 0,
            },
          },
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);
}

async function computeDownloadStats(filter = {}) {
  const res = await Voeu.aggregate([{ $unwind: "$_meta.import_dates" }, { $group: { _id: "$_meta.import_dates" } }]);
  const importDates = res
    .map((r) => r._id)
    .sort((a, b) => a - b)
    .reverse();

  return Promise.all(
    importDates.map((importDate, index) => {
      const next = importDates[index - 1];
      const dateFilter = { date: { $gte: importDate, ...(next ? { $lt: next } : {}) } };

      return promiseAllProps({
        import_date: importDate,
        nbCfas: Cfa.countDocuments({ ...filter, voeux_telechargements: { $elemMatch: { ...dateFilter } } }),
        nbVoeux: countVoeux({ ...filter, voeux_telechargements: { $elemMatch: { ...dateFilter } } }),
      });
    })
  );
}

async function computeStats(options = {}) {
  const list = [
    { code: "ALL", query: {} },
    { code: "UNKNOWN", query: { "academie.code": { $exists: false } } },
    {
      code: "AFFELNET",
      query: {
        "academie.code": {
          $in: ["01", "03", "06", "07", "09", "11", "12", "14", "16", "18", "19", "23", "24", "25", "27", "28", "70"],
        },
      },
    },
    {
      code: "SANS_AFFELNET",
      query: {
        "academie.code": {
          $in: ["02", "04", "08", "10", "13", "15", "17", "20", "22", "31", "32", "33", "43"],
        },
      },
    },
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
    cfas: forAcademies(computeCfasStats),
    voeux: forAcademies(computeVoeuxStats),
    emails: forAcademies(computeEmailsStats),
    téléchargements: forAcademies(computeDownloadStats),
  });
}

module.exports = computeStats;
