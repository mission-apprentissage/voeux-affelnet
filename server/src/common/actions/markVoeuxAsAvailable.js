const { Cfa } = require("../model/index.js");
const logger = require("../logger.js");

async function markVoeuxAsAvailable(uai, voeuxDate) {
  const { matchedCount } = await Cfa.updateOne(
    { "etablissements.uai": uai },
    {
      $set: {
        "etablissements.$.voeux_date": voeuxDate,
      },
    },
    { runValidators: true }
  );

  if (matchedCount === 0) {
    logger.warn(`L'√©tablissement d'accueil n'est pas connu dans la base des CFA ${uai}`);
    return false;
  }
  return true;
}

module.exports = { markVoeuxAsAvailable };
