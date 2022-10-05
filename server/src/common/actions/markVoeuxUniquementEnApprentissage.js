const { Voeu } = require("../model/index.js");

function markVoeuxUniquementEnApprentissage(ine) {
  return Voeu.updateMany(
    {
      "apprenant.ine": ine,
    },
    {
      $set: {
        "_meta.jeune_uniquement_en_apprentissage": true,
      },
    },
    { runValidators: true }
  ).exec();
}

module.exports = { markVoeuxUniquementEnApprentissage };
