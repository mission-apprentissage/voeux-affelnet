const { Cfa } = require("../model");
const Boom = require("boom");

async function confirm(siret, email, options = {}) {
  let cfa = await Cfa.findOne({ siret });

  if (!email || (!options.force && cfa.statut !== "en attente")) {
    throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le cfa ${siret}`);
  }

  return Cfa.findOneAndUpdate(
    { siret },
    {
      $set: {
        statut: "confirmé",
        email,
      },
    },
    { new: true }
  ).lean();
}

module.exports = { confirm };
