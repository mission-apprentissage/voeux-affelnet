const https = require("https");
const logger = require("../logger");
const { parse: parseUrl } = require("url"); // eslint-disable-line node/no-deprecated-api

module.exports = {
  getFileAsStream: async (url, httpOptions = {}) => {
    return new Promise((resolve, reject) => {
      let options = {
        ...parseUrl(url),
        method: "GET",
        ...httpOptions,
      };

      logger.info(`Downloading ${url}...`);
      let req = https.request(options, (res) => {
        if (res.statusCode >= 400) {
          reject(new Error(`Unable to get ${url}. Status code ${res.statusCode}`));
        }

        resolve(res);
      });
      req.end();
    });
  },
};
