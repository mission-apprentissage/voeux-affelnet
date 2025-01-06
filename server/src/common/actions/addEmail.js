const { User } = require("../model");

function addEmail(user, token, templateName, variables = {}) {
  return User.updateOne(
    { username: user.username },
    {
      $push: {
        emails: {
          token,
          templateName,
          sendDates: [new Date()],
          variables,
        },
      },
    },
    { runValidators: true }
  );
}

module.exports = { addEmail };
