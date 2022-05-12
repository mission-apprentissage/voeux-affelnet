const { User } = require("../model");

async function cancelUnsubscription(username) {
  return User.findOneAndUpdate(
    { username },
    {
      $set: {
        unsubscribe: false,
      },
    },
    { new: true }
  ).lean();
}

module.exports = { cancelUnsubscription };
