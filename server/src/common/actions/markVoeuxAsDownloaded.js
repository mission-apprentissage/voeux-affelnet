const { DOWNLOAD_TYPE } = require("../constants/DownloadType");
const { Responsable, Delegue, Voeu, Relation } = require("../model");
const {
  saveListDownloadedByResponsable,
  saveListDownloadedByDelegue,
  saveUpdatedListDownloadedByResponsable,
  saveUpdatedListDownloadedByDelegue,
} = require("./history/relation");

const markVoeuxAsDownloadedByResponsable = async (uai_responsable, uai_formateur) => {
  const responsable = await Responsable.findOne({ uai: uai_responsable }).lean();

  await Relation.updateOne(
    { "etablissement_responsable.uai": uai_responsable, "etablissement_formateur.uai": uai_formateur },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ user: responsable._id, DOWNLOAD_TYPE: DOWNLOAD_TYPE.RESPONSABLE, date: new Date() }],
          $slice: 500,
        },
      },
      $set: { nombre_voeux_restant: 0 },
    }
  );

  if (
    await Voeu.countDocuments({
      "etablissement_responsable.uai": uai_responsable,
      "etablissement_formateur.uai": uai_formateur,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    await saveUpdatedListDownloadedByResponsable({ uai_responsable, uai_formateur });
  } else {
    await saveListDownloadedByResponsable({ uai_responsable, uai_formateur });
  }
};

const markVoeuxAsDownloadedByDelegue = async (uai_responsable, uai_formateur) => {
  console.log("markVoeuxAsDownloadedByDelegue", { uai_responsable, uai_formateur });

  const delegue = await Delegue.findOne({
    relations: {
      $elemMatch: {
        "etablissement_responsable.uai": uai_responsable,
        "etablissement_formateur.uai": uai_formateur,
        active: true,
      },
    },
  });

  await Relation.updateOne(
    { "etablissement_responsable.uai": uai_responsable, "etablissement_formateur.uai": uai_formateur },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ user: delegue._id, DOWNLOAD_TYPE: DOWNLOAD_TYPE.DELEGUE, date: new Date() }],
          $slice: 500,
        },
      },
      $set: { nombre_voeux_restant: 0 },
    }
  );

  if (
    await Voeu.countDocuments({
      "etablissement_responsable.uai": uai_responsable,
      "etablissement_formateur.uai": uai_formateur,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    return await saveUpdatedListDownloadedByDelegue({ uai_responsable, uai_formateur });
  } else {
    return await saveListDownloadedByDelegue({ uai_responsable, uai_formateur });
  }
};

module.exports = {
  markVoeuxAsDownloadedByResponsable,
  markVoeuxAsDownloadedByDelegue,
};
