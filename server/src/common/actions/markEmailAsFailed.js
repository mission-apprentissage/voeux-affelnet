const { User } = require("../model");

async function markEmailAsFailed(messageId, type) {
  await User.updateOne(
    { "emails.messageIds": messageId },
    {
      $set: {
        "emails.$.error": {
          type,
        },
      },
    },
    { runValidators: true }
  );
}

module.exports = { markEmailAsFailed };
