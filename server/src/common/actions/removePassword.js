const { User } = require("../model");

async function removePassword(username) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error(`Unable to find user ${username}`);
  }

  user.password = undefined;
  await user.save();

  return user.toObject();
}

module.exports = { removePassword };
