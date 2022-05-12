const RateLimitedApi = require("./RateLimitedApi");
const { fetchJson } = require("../utils/httpUtils");
const queryString = require("query-string");
const logger = require("../logger");

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

class CatalogueApi extends RateLimitedApi {
  constructor(options = {}) {
    super("CatalogueApi", { nbRequests: 5, durationInSeconds: 1, ...options });
  }

  static get baseApiUrl() {
    return "https://catalogue.apprentissage.beta.gouv.fr/api";
  }

  async getFormations(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching formations...`, query);
      let params = convertQueryIntoParams(query, options);
      let response = await fetchJson(`${CatalogueApi.baseApiUrl}/entity/formations?${params}`);
      return response.data;
    });
  }
}

module.exports = CatalogueApi;
