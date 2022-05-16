const { User } = require("../model");

async function checkIfEmailExists(token) {
  const count = await User.countDocuments({ "emails.token": token });
  return count > 0;
}

module.exports = { checkIfEmailExists };
