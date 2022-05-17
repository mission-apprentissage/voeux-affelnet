const { User } = require("../model");

function addEmailSendDate(token, templateName) {
  return User.updateOne(
    { "emails.token": token },
    {
      $set: {
        "emails.$.templateName": templateName,
      },
      $push: {
        "emails.$.sendDates": new Date(),
      },
    },
    { runValidators: true }
  );
}

module.exports = { addEmailSendDate };
