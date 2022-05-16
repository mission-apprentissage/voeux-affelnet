const { User } = require("../model");

async function markEmailAsDelivered(messageId) {
  await User.updateOne(
    { "emails.messageIds": messageId },
    {
      $unset: {
        "emails.$.error": 1,
      },
    },
    { runValidators: true }
  );
}

module.exports = { markEmailAsDelivered };
