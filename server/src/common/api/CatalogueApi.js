const RateLimitedApi = require("./RateLimitedApi");
const { _fetch, fetchJson } = require("../utils/httpUtils");
const queryString = require("query-string");
const logger = require("../logger");
const config = require("../../config");

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
  #getFormationsCache = new Map();

  constructor(options = {}) {
    super("CatalogueApi", { nbRequests: 5, durationInSeconds: 1, ...options });
  }

  static get baseApiUrl() {
    return config.catalog.endpoint;
  }

  async execute(callback) {
    if (!this.cookie) {
      await this.connect();
    }

    return await super.execute(callback);
  }

  async connect() {
    if (!config.catalog.endpoint || !config.catalog.username || !config.catalog.password) {
      throw Error("Missing env variables to connect to Catalogue API");
    }

    const response = await _fetch(`${CatalogueApi.baseApiUrl}/auth/login`, {
      method: "POST",
      data: { username: config.catalog.username, password: config.catalog.password },
    });

    logger.info(`Setting cookie : ${response.headers["set-cookie"]?.[0]}`);
    this.cookie = response.headers["set-cookie"]?.[0];
  }

  async getFormations(query, options) {
    const params = convertQueryIntoParams(query, options);

    if (this.#getFormationsCache.has(JSON.stringify(params))) {
      return this.#getFormationsCache.get(JSON.stringify(params));
    }

    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching formations...`, query);
      const response = fetchJson(`${CatalogueApi.baseApiUrl}/entity/formations?${params}`, {
        headers: { Cookie: this.cookie },
      });

      this.#getFormationsCache.set(JSON.stringify(params), response);

      return response;
    });
  }

  async postFormations(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching formations...`, query);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/formations`, {
        ...options,
        headers: { Cookie: this.cookie },
        data: query,
        method: "POST",
      });
    });
  }

  async getEtablissements(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching etablissements...`, query);
      const params = convertQueryIntoParams(query, options);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/etablissements?${params}`, {
        headers: { Cookie: this.cookie },
      });
    });
  }

  async getEtablissement(query, options) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching etablissement...`, query);
      const params = convertQueryIntoParams(query, options);
      return fetchJson(`${CatalogueApi.baseApiUrl}/entity/etablissement?${params}`, {
        headers: { Cookie: this.cookie },
      });
    });
  }
}

module.exports = CatalogueApi;
