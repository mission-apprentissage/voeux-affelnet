const { User } = require("../model");

function addEmail(user, token, templateName, data = {}) {
  return User.updateOne(
    { username: user.username },
    {
      $push: {
        emails: {
          token,
          templateName,
          sendDates: [new Date()],
          data,
          // data: JSON.stringify(data ?? {}),
        },
      },
    },
    { runValidators: true }
  );
}

module.exports = { addEmail };
