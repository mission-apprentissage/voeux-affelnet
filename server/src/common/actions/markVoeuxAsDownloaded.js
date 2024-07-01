const { UserType } = require("../constants/UserType");
const { Responsable, Delegue, Voeu, Relation } = require("../model");
const {
  saveListDownloadedByResponsable,
  saveListDownloadedByDelegue,
  saveUpdatedListDownloadedByResponsable,
  saveUpdatedListDownloadedByDelegue,
} = require("./history/relation");

const markVoeuxAsDownloadedByResponsable = async (siret, uai) => {
  const responsable = await Responsable.findOne({ siret }).lean();

  await Relation.updateOne(
    { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ user: responsable._id, userType: UserType.RESPONSABLE, date: new Date() }],
          $slice: 500,
        },
      },
      $set: { nombre_voeux_restant: 0 },
    }
  );

  if (
    await Voeu.countDocuments({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    await saveUpdatedListDownloadedByResponsable({ uai, siret });
  } else {
    await saveListDownloadedByResponsable({ uai, siret });
  }
};

const markVoeuxAsDownloadedByDelegue = async (siret, uai) => {
  console.log("markVoeuxAsDownloadedByDelegue", { siret, uai });

  const delegue = await Delegue.findOne({
    relations: {
      $elemMatch: {
        "etablissement_responsable.siret": siret,
        "etablissement_formateur.uai": uai,
        active: true,
      },
    },
  });

  await Relation.updateOne(
    { "etablissement_responsable.siret": siret, "etablissement_formateur.uai": uai },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ user: delegue._id, userType: UserType.DELEGUE, date: new Date() }],
          $slice: 500,
        },
      },
      $set: { nombre_voeux_restant: 0 },
    }
  );

  if (
    await Voeu.countDocuments({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    return await saveUpdatedListDownloadedByDelegue({ uai, siret });
  } else {
    return await saveListDownloadedByDelegue({ uai, siret });
  }
};

module.exports = {
  markVoeuxAsDownloadedByResponsable,
  markVoeuxAsDownloadedByDelegue,
};
