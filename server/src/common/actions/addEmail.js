const { User } = require("../model");

function addEmail(user, token, templateName) {
  return User.updateOne(
    { username: user.username },
    {
      $push: {
        emails: {
          token,
          templateName,
          sendDates: [new Date()],
        },
      },
    },
    { runValidators: true }
  );
}

module.exports = { addEmail };
