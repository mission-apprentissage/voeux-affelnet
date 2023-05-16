const { Gestionnaire, Formateur } = require("../model");

const markVoeuxAsDownloadedByGestionnaire = async (siret, uai) => {
  await Gestionnaire.updateOne(
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
};

module.exports = { markVoeuxAsDownloadedByGestionnaire, markVoeuxAsDownloadedByFormateur };
