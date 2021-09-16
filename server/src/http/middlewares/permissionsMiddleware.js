const _ = require("lodash");

module.exports = (permissions = {}) => {
  return (req, res, next) => {
    let current = _.pick(req.user, Object.keys(permissions));
    if (_.isEqual(current, permissions)) {
      next();
    } else {
      return res.status(401).send("");
    }
  };
};
