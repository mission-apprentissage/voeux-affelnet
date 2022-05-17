const { User } = require("../model");

function addEmailMessageId(token, messageId) {
  return User.updateOne(
    { "emails.token": token },
    {
      $addToSet: {
        "emails.$.messageIds": messageId,
      },
      $unset: {
        "emails.$.error": 1,
      },
    },
    { runValidators: true }
  );
}

module.exports = { addEmailMessageId };
