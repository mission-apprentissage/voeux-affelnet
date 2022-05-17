const { User } = require("../model");

function addEmailError(token, e) {
  return User.updateOne(
    { "emails.token": token },
    {
      $set: {
        "emails.$.error": {
          type: "fatal",
          message: e.message,
        },
      },
    },
    { runValidators: true }
  );
}

module.exports = { addEmailError };
