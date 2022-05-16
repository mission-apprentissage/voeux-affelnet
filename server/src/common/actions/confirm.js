const { Cfa } = require("../model");
const Boom = require("boom");
const { changeEmail } = require("./changeEmail");

async function confirm(siret, email, options = {}) {
  const cfa = await Cfa.findOne({ siret });
  const isNewEmail = cfa.email !== email;

  if (!email || (!options.force && cfa.statut !== "en attente")) {
    throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le cfa ${siret}`);
  }

  if (isNewEmail) {
    await changeEmail(siret, email);
  }

  return Cfa.findOneAndUpdate(
    { siret },
    {
      $set: {
        statut: "confirmé",
      },
    },
    { new: true }
  ).lean();
}

module.exports = { confirm };
