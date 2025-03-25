const { DOWNLOAD_TYPE } = require("../constants/DownloadType");
const { Etablissement, Delegue, Voeu, Relation } = require("../model");
const {
  saveListDownloadedByResponsable,
  saveListDownloadedByDelegue,
  saveUpdatedListDownloadedByResponsable,
  saveUpdatedListDownloadedByDelegue,
} = require("./history/relation");

const markVoeuxAsDownloadedByResponsable = async ({ siret_responsable, siret_formateur }) => {
  const responsable = await Etablissement.findOne({ siret: siret_responsable }).lean();

  await Relation.updateOne(
    { "etablissement_responsable.siret": siret_responsable, "etablissement_formateur.siret": siret_formateur },
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
      "etablissement_responsable.siret": siret_responsable,
      "etablissement_formateur.siret": siret_formateur,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    await saveUpdatedListDownloadedByResponsable({ siret_responsable, siret_formateur });
  } else {
    await saveListDownloadedByResponsable({ siret_responsable, siret_formateur });
  }
};

const markVoeuxAsDownloadedByDelegue = async ({ siret_responsable, siret_formateur }) => {
  console.log("markVoeuxAsDownloadedByDelegue", { siret_responsable, siret_formateur });

  const delegue = await Delegue.findOne({
    relations: {
      $elemMatch: {
        "etablissement_responsable.siret": siret_responsable,
        "etablissement_formateur.siret": siret_formateur,
        active: true,
      },
    },
  });

  await Relation.updateOne(
    { "etablissement_responsable.siret": siret_responsable, "etablissement_formateur.siret": siret_formateur },
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
      "etablissement_responsable.siret": siret_responsable,
      "etablissement_formateur.siret": siret_formateur,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    return await saveUpdatedListDownloadedByDelegue({ siret_responsable, siret_formateur });
  } else {
    return await saveListDownloadedByDelegue({ siret_responsable, siret_formateur });
  }
};

module.exports = {
  markVoeuxAsDownloadedByResponsable,
  markVoeuxAsDownloadedByDelegue,
};
