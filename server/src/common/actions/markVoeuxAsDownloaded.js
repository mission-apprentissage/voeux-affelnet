const { Cfa } = require("../model");

function markVoeuxAsDownloaded(siret, uai) {
  return Cfa.updateOne(
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
