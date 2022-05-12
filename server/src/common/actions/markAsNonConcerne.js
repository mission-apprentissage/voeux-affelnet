const { User } = require("../model");

async function markAsNonConcerne(username) {
  return User.findOneAndUpdate(
    { username },
    {
      $set: {
        statut: "non concerné",
      },
    },
    { new: true }
  ).lean();
}

module.exports = { markAsNonConcerne };
