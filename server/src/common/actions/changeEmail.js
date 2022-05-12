const { User } = require("../model");

async function changeEmail(username, newEmail) {
  return User.findOneAndUpdate(
    { username },
    {
      $set: {
        email: newEmail,
      },
    },
    { new: true }
  ).lean();
}

module.exports = { changeEmail };
