const { USER_TYPE } = require("../constants/UserType");
const { User } = require("../model");

async function changeEmail(username, newEmail, options = {}) {
  const auteur = options.auteur;
  const previous = await User.findOne({ username });

  return User.findOneAndUpdate(
    { username },
    {
      $set: {
        email: newEmail,
        ...(previous.type === USER_TYPE.DELEGUE ? { username: newEmail } : {}),
      },
      ...(previous.email
        ? {
            $push: {
              anciens_emails: {
                email: previous.email,
                modification_date: new Date(),
                ...(auteur ? { auteur } : {}),
              },
            },
          }
        : {}),
    },
    { new: true }
  ).lean();
}

module.exports = { changeEmail };
