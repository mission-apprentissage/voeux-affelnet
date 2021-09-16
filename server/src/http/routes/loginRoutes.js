const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { createApiToken } = require("../../common/utils/jwtUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap
  const { checkUsernameAndPassword } = authMiddleware(users);

  router.post(
    "/api/login",
    checkUsernameAndPassword(),
    tryCatch(async (req, res) => {
      let user = req.user;

      let token = createApiToken(user);
      return res.json({ token });
    })
  );

  return router;
};
