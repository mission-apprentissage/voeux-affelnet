const { User } = require("../model");

async function markEmailAsOpened(token) {
  await User.updateOne(
    { "emails.token": token },
    {
      $set: {
        "emails.$.openDate": new Date(),
      },
    },
    { runValidators: true }
  );
}

module.exports = { markEmailAsOpened };
