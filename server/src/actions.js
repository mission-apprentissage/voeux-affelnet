const createEmailActions = require("./common/actions/createEmailActions");

module.exports = async (options = {}) => {
  return {
    ...createEmailActions(options),
  };
};
