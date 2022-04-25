const axios = require("axios");
const miniget = require("miniget");
const logger = require("../logger");

module.exports = {
  getUrl: (url, options) => axios.get(url, options),
  getFileAsStream: (url, options = {}) => {
    logger.info(`Downloading ${url}...`);
    return miniget(url, options);
  },
};
