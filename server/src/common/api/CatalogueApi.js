const RateLimitedApi = require("./RateLimitedApi");
const { fetchJson } = require("../utils/httpUtils");
const queryString = require("query-string");
const logger = require("../logger");

function convertQueryIntoParams(query, options = {}) {
  return queryString.stringify(
    {
      query: JSON.stringify(query).replaceAll("#", "%23"),
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
      const params = convertQueryIntoParams(query, options);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/formations?${params}`);
    });
  }

  async postFormations(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching formations...`, query);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/formations`, { ...options, method: "POST" });
    });
  }

  async getEtablissements(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching etablissements...`, query);
      const params = convertQueryIntoParams(query, options);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/etablissements?${params}`);
    });
  }

  async getEtablissement(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching etablissement...`, query);
      const params = convertQueryIntoParams(query, options);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/etablissement?${params}`);
    });
  }
}

module.exports = CatalogueApi;
