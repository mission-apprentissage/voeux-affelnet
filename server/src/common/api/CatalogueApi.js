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

const getFormationsCache = new Map();
const getEtablissementsCache = new Map();
const getEtablissementCache = new Map();

class CatalogueApi extends RateLimitedApi {
  constructor(options = {}) {
    super("CatalogueApi", { nbRequests: 3, durationInSeconds: 1, ...options });
  }

  static get baseApiUrl() {
    return config.catalog.endpoint;
  }

  async execute(callback) {
    const connect = this.disallowConcurrency(this.connect.bind(this));

    await connect();

    try {
      return await super.execute(callback);
    } catch (e) {
      console.log(e);
      if (e.response?.status !== 404) {
        throw e;
      }
    }
  }

  disallowConcurrency(fn) {
    let inprogressPromise = Promise.resolve();

    return (...args) => {
      inprogressPromise = inprogressPromise.then(() => fn(...args));

      return inprogressPromise;
    };
  }

  async connect() {
    if (!this.cookie) {
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
  }

  async getFormations(query, options) {
    const params = convertQueryIntoParams(query, options);

    if (getFormationsCache.has(JSON.stringify(params))) {
      return getFormationsCache.get(JSON.stringify(params));
    }

    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching formations...`, query);
      try {
        const response = await fetchJson(`${CatalogueApi.baseApiUrl}/entity/formations?${params}`, {
          headers: { Cookie: this.cookie },
        });

        getFormationsCache.set(JSON.stringify(params), response);

        return response;
      } catch (e) {
        // console.error(e);
        return [];
      }
    });
  }

  async getFormation(query, options) {
    const params = convertQueryIntoParams(query, options);

    if (getFormationsCache.has(JSON.stringify(params))) {
      return getFormationsCache.get(JSON.stringify(params));
    }

    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching formation...`, query);
      try {
        const response = await fetchJson(`${CatalogueApi.baseApiUrl}/entity/formation?${params}`, {
          headers: { Cookie: this.cookie },
        });

        getFormationsCache.set(JSON.stringify(params), response);

        return response;
      } catch (e) {
        // console.error(e);
        return null;
      }
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
    const params = convertQueryIntoParams(query, options);

    if (getEtablissementsCache.has(JSON.stringify(params))) {
      return getEtablissementsCache.get(JSON.stringify(params));
    }

    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching etablissements...`, query);

      try {
        const response = await fetchJson(`${CatalogueApi.baseApiUrl}/entity/etablissements?${params}`, {
          headers: { Cookie: this.cookie },
        });

        getEtablissementsCache.set(JSON.stringify(params), response);

        return response;
      } catch (e) {
        // console.log(params, e);
      }
    });
  }

  async getEtablissement(query, options) {
    const params = convertQueryIntoParams(query, options);

    if (getEtablissementCache.has(JSON.stringify(params))) {
      return getEtablissementCache.get(JSON.stringify(params));
    }

    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching etablissement...`, query);
      const params = convertQueryIntoParams(query, options);
      try {
        const response = await fetchJson(`${CatalogueApi.baseApiUrl}/entity/etablissement?${params}`, {
          headers: { Cookie: this.cookie },
        });

        getEtablissementCache.set(JSON.stringify(params), response);

        return response;
      } catch (e) {
        // console.log(params, e);
      }
    });
  }
}

module.exports = CatalogueApi;
