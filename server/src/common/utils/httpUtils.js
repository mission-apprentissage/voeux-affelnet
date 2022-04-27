const logger = require("../logger");
const nodeFetch = require("node-fetch");
const { compose, transformData } = require("oleoduc");

class HTTPResponseError extends Error {
  constructor(response, ...args) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
    this.response = response;
  }
}

module.exports = {
  fetch: async (url, options = {}) => {
    let { method = "GET", body, ...rest } = options;
    logger.debug(`${method} ${url}...`);

    const response = await nodeFetch(url, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...rest,
    });

    if (response.ok) {
      return compose(
        response.body,
        transformData((d) => d.toString())
      );
    } else {
      throw new HTTPResponseError(response);
    }
  },
};
