const axios = require("axios");
const { compose, transformData } = require("oleoduc");
const logger = require("../logger").child({ context: "http" });

async function _fetch(url, options = {}) {
  const { method = "GET", data, ...rest } = options;
  logger.debug(`${method} ${url}...`);

  return axios.request({
    url,
    method,
    ...(data ? { data } : {}),
    ...rest,
  });
}

async function fetchStream(url, options = {}) {
  const response = await _fetch(url, { ...options, responseType: "stream" });
  return compose(
    response.data,
    transformData((d) => d.toString())
  );
}

async function fetchJson(url, options = {}) {
  const response = await _fetch(url, { ...options, responseType: "json" });
  return response.data;
}

module.exports = {
  _fetch,
  fetchStream,
  fetchJson,
};
