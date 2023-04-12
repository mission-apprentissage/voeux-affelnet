const { User } = require("../model");

function getUser(username) {
  return User.findOne({ username }).select("+password");
}

module.exports = { getUser };
