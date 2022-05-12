const { User } = require("../model");
const sha512Utils = require("../utils/passwordUtils");

async function changePassword(username, newPassword) {
  let user = await User.findOne({ username });
  if (!user) {
    throw new Error(`Unable to find user ${username}`);
  }

  user.password = sha512Utils.hash(newPassword);
  await user.save();

  return user.toObject();
}

module.exports = { changePassword };
