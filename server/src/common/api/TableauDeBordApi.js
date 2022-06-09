const RateLimitedApi = require("./RateLimitedApi");
const { fetchStream, fetchJson } = require("../utils/httpUtils");
const { compose, transformData } = require("oleoduc");
const queryString = require("query-string");
const Pick = require("stream-json/filters/Pick");
const { streamArray } = require("stream-json/streamers/StreamArray");

function convertQueryIntoParams(query, options = {}) {
  return queryString.stringify(
    {
      query: JSON.stringify(query),
      ...Object.keys(options).reduce((acc, key) => {
        return {
          ...acc,
          [key]: JSON.stringify(options[key]),
        };
      }, {}),
    },
    { encode: false }
  );
}

function streamNestedJsonArray(arrayPropertyName) {
  return compose(
    Pick.withParser({ filter: arrayPropertyName }),
    streamArray(),
    transformData((data) => data.value)
  );
}

class TableauDeBordApi extends RateLimitedApi {
  constructor(options = {}) {
    super("TableauDeBordApi", { nbRequests: 5, durationInSeconds: 1, ...options });
  }

  static get baseApiUrl() {
    return "https://cfas.apprentissage.beta.gouv.fr/api";
  }

  async streamCfas(query, options) {
    const params = convertQueryIntoParams(query, options);

    const response = await fetchStream(`${TableauDeBordApi.baseApiUrl}/cfas?${params}`);

    return compose(response, streamNestedJsonArray("cfas"));
  }

  async getCfas(query, options) {
    const params = convertQueryIntoParams(query, options);

    return fetchJson(`${TableauDeBordApi.baseApiUrl}/cfas?${params}`);
  }
}

module.exports = TableauDeBordApi;
