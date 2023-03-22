const { Gestionnaire } = require("../model");

function markVoeuxAsDownloaded(siret, uai) {
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

module.exports = { markVoeuxAsDownloaded };
