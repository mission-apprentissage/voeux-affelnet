const emailActions = require("./common/actions/emailActions");

module.exports = async (options = {}) => {
  return {
    ...emailActions(options),
  };
};
