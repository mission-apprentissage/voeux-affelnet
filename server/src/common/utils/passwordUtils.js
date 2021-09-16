const crypto = require("crypto");
const { sha512crypt } = require("sha512crypt-node");
const config = require("../../config");

module.exports = {
  hash: (password, rounds = config.auth.passwordHashRounds) => {
    let salt = crypto.randomBytes(16).toString("hex");
    return sha512crypt(password, `$6$rounds=${rounds}$${salt}`);
  },
  compare: (password, hash) => {
    let array = hash.split("$");
    array.pop();

    return sha512crypt(password, array.join("$")) === hash;
  },
};
