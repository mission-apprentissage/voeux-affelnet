const { Responsable, Formateur, Voeu } = require("../model");
const {
  saveListDownloadedByResponsable,
  saveListDownloadedByFormateur,
  saveUpdatedListDownloadedByFormateur,
  saveUpdatedListDownloadedByResponsable,
} = require("./history/formateur");

const markVoeuxAsDownloadedByResponsable = async (siret, uai) => {
  await Responsable.updateOne(
    { siret },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ uai, date: new Date() }],
          $slice: 500,
        },
      },
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

const markVoeuxAsDownloadedByFormateur = async (siret, uai) => {
  console.log("markVoeuxAsDownloadedByFormateur", { siret, uai });
  await Formateur.updateOne(
    { uai },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ siret, date: new Date() }],
          $slice: 500,
        },
      },
    }
  );

  if (
    await Voeu.countDocuments({
      "etablissement_formateur.uai": uai,
      "etablissement_responsable.siret": siret,
      "_meta.import_dates.1": { $exists: true },
    })
  ) {
    return await saveUpdatedListDownloadedByFormateur({ uai, siret });
  } else {
    return await saveListDownloadedByFormateur({ uai, siret });
  }
};

module.exports = { markVoeuxAsDownloadedByResponsable, markVoeuxAsDownloadedByFormateur };
