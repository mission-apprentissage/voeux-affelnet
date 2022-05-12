const { User } = require("../model");

function getUser(username) {
  return User.findOne({ username });
}

module.exports = { getUser };
