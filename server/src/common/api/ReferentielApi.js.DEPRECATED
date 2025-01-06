const logger = require("../logger");
const queryString = require("query-string");
const RateLimitedApi = require("./RateLimitedApi");
const { fetchJson } = require("../utils/httpUtils");

class ReferentielApi extends RateLimitedApi {
  constructor(options = {}) {
    super("ReferentielApi", { nbRequests: 6, durationInSeconds: 1, ...options });
  }

  static get baseApiUrl() {
    return "https://referentiel.apprentissage.beta.gouv.fr/api/v1";
  }

  async getOrganisme(siret, params = {}) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching organisme ${siret}...`);
      const url = `${ReferentielApi.baseApiUrl}/organismes/${siret}?${queryString.stringify(params)}`;
      return fetchJson(url);
    });
  }

  async searchOrganismes(search) {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Searching organismes with ${queryString.stringify(search)}...`);
      const url = `${ReferentielApi.baseApiUrl}/organismes?${queryString.stringify(search)}`;
      return fetchJson(url);
    });
  }
}

module.exports = ReferentielApi;
