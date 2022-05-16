const { pick } = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("../../config");

function createToken(type, subject, options = {}) {
  const defaults = config.auth[type];
  const secret = options.secret || defaults.jwtSecret;
  const expiresIn = options.expiresIn || defaults.expiresIn;
  const payload = options.payload || {};

  return jwt.sign(payload, secret, {
    issuer: "voeux-affelnet",
    expiresIn: expiresIn,
    subject: subject,
  });
}

function createApiToken(user, options = {}) {
  return createToken("apiToken", user.username, {
    payload: { type: user.type, permissions: pick(user, ["isAdmin"]) },
    ...options,
  });
}

function createActionToken(username, options = {}) {
  return createToken("actionToken", username, options);
}

function createResetPasswordToken(username, options = {}) {
  return createToken("resetPasswordToken", username, options);
}

module.exports = {
  createActionToken,
  createResetPasswordToken,
  createApiToken,
};
