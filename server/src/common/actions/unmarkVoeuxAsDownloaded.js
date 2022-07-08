const { Cfa } = require("../model");

function unmarkVoeuxAsDownloaded(siret, uai) {
  if (!uai) {
    return Cfa.updateOne(
      { siret },
      {
        $set: {
          voeux_telechargements: [],
        },
      }
    ).exec();
  } else {
    const cfa = Cfa.findOne({ siret });
    return Cfa.updateOne(
      { siret },
      {
        $set: {
          voeux_telechargements: cfa.voeux_telechargements.filter((vt) => vt.uai !== uai),
        },
      }
    ).exec();
  }
}

module.exports = { unmarkVoeuxAsDownloaded };
