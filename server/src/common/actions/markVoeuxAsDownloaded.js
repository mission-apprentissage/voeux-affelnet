const { Gestionnaire, Formateur } = require("../model");

function markVoeuxAsDownloadedByGestionnaire(siret, uai) {
  return Gestionnaire.updateOne(
    { siret },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ uai, date: new Date() }],
          $slice: 500,
        },
      },
    }
  ).exec();
}

function markVoeuxAsDownloadedByFormateur(siret, uai) {
  return Formateur.updateOne(
    { uai },
    {
      $push: {
        voeux_telechargements: {
          $each: [{ siret, date: new Date() }],
          $slice: 500,
        },
      },
    }
  ).exec();
}

module.exports = { markVoeuxAsDownloadedByGestionnaire, markVoeuxAsDownloadedByFormateur };
