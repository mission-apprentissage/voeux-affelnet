const { User } = require("../model");

async function removeUser(username) {
  let user = await User.findOne({ username });
  if (!user) {
    throw new Error(`Unable to find user ${username}`);
  }

  await user.deleteOne({ username });
}

module.exports = { removeUser };
