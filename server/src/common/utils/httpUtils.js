const logger = require("../logger");
const axios = require("axios");
const { compose, transformData } = require("oleoduc");

module.exports = {
  fetch: async (url, options = {}) => {
    let { method = "GET", data, ...rest } = options;
    logger.debug(`${method} ${url}...`);

    const response = await axios.request({
      url,
      method,
      responseType: "stream",
      ...(data ? { data } : {}),
      ...rest,
    });

    return compose(
      response.data,
      transformData((d) => d.toString())
    );
  },
};
