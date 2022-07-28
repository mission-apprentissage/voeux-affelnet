const { Cfa, Voeu } = require("../common/model");
const { promiseAllProps } = require("../common/utils/asyncUtils");
const { getAcademies } = require("../common/academies");
const {
  areTelechargementsTotal,
  areTelechargementsPartiel,
  areTelechargementsAucun,
} = require("../common/utils/cfaUtils");

function computeCfasStats(filter = {}) {
  return promiseAllProps({
    total: Cfa.countDocuments({ ...filter, etablissements: { $exists: true, $not: { $size: 0 } } }),
    enAttente: Cfa.countDocuments({
      ...filter,
      statut: "en attente",
      etablissements: { $exists: true, $not: { $size: 0 } },
    }),

    enAttenteAvecVoeux: Cfa.countDocuments({
      ...filter,
      statut: "en attente",
      etablissements: { $exists: true, $not: { $size: 0 } },
      "etablissements.voeux_date": { $exists: true },
    }),

    confirmés: Cfa.countDocuments({
      ...filter,
      statut: "confirmé",
      etablissements: { $exists: true, $not: { $size: 0 } },
    }),

    confirmésAvecVoeux: Cfa.countDocuments({
      ...filter,
      statut: "confirmé",
      etablissements: { $exists: true, $not: { $size: 0 } },
      "etablissements.voeux_date": { $exists: true },
    }),

    activés: Cfa.countDocuments({ ...filter, statut: "activé", etablissements: { $exists: true, $not: { $size: 0 } } }),

    activésAvecVoeux: Cfa.countDocuments({
      ...filter,
      statut: "activé",
      etablissements: { $exists: true, $not: { $size: 0 } },
      "etablissements.voeux_date": { $exists: true },
    }),

    téléchargésVoeux: Cfa.countDocuments({
      ...filter,
      statut: "activé",
      etablissements: { $exists: true, $not: { $size: 0 } },
      "etablissements.voeux_date": { $exists: true },
      voeux_telechargements: { $exists: true, $not: { $size: 0 } },
    }),

    téléchargésVoeuxTotal: (async () => {
      const cfas = await Cfa.find({
        ...filter,
        statut: "activé",
        etablissements: { $exists: true, $not: { $size: 0 } },
        "etablissements.voeux_date": { $exists: true },
        voeux_telechargements: { $exists: true, $not: { $size: 0 } },
      });

      return cfas.filter((cfa) => areTelechargementsTotal(cfa.etablissements, cfa.voeux_telechargements)).length;
    })(),

    téléchargésVoeuxPartiel: (async () => {
      const cfas = await Cfa.find({
        ...filter,
        statut: "activé",
        etablissements: { $exists: true, $not: { $size: 0 } },
        "etablissements.voeux_date": { $exists: true },
        voeux_telechargements: { $exists: true, $not: { $size: 0 } },
      });

      return cfas.filter((cfa) => areTelechargementsPartiel(cfa.etablissements, cfa.voeux_telechargements)).length;
    })(),

    téléchargésVoeuxAucun: (async () => {
      const cfas = await Cfa.find({
        ...filter,
        statut: "activé",
        etablissements: { $exists: true, $not: { $size: 0 } },
        "etablissements.voeux_date": { $exists: true },
      });

      return cfas.filter((cfa) => areTelechargementsAucun(cfa.etablissements, cfa.voeux_telechargements)).length;
    })(),

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
    nbVoeuxDiffusés: Cfa.aggregate([
      {
        $match: {
          ...filter,
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
          $expr: {
            $eq: ["$etablissements.uai", "$voeux_telechargements.uai"],
          },
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
          _id: { siret: "$siret", uai: "$voeux_telechargements.uai" },
          siret: { $first: "$siret" },
          uai: { $first: "$voeux_telechargements.uai" },
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
            uai: "$uai",
            downloadDate: "$downloadDate",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$etablissement_accueil.uai", "$$uai"] },
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
          statut: 1,
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
        total: Cfa.countDocuments({ ...filter, voeux_telechargements: { $elemMatch: { ...dateFilter } } }),
      });
    })
  );
}

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
    cfas: forAcademies(computeCfasStats),
    voeux: forAcademies(computeVoeuxStats),
    emails: forAcademies(computeEmailsStats),
    téléchargements: forAcademies(computeDownloadStats),
  });
}

module.exports = computeStats;
