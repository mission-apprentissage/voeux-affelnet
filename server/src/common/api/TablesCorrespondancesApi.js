const queryString = require("query-string");
const logger = require("../logger");
const ApiError = require("./ApiError");
const RateLimitedApi = require("./RateLimitedApi");

class TablesCorrespondancesApi extends RateLimitedApi {
  constructor(options = {}) {
    super("TablesCorrespondancesApi", "https://tables-correspondances.apprentissage.beta.gouv.fr", options);
  }

  getEtablissements(query, options = {}) {
    return this.execute(async (client) => {
      try {
        let params = queryString.stringify(
          {
            query: JSON.stringify(query || {}),
            ...Object.keys(options).reduce((acc, key) => {
              return {
                ...acc,
                [key]: JSON.stringify(options[key]),
              };
            }, {}),
          },
          { encode: false }
        );

        logger.debug(`[${this.name}] Fetching établissements with params ${params}...`);
        let response = await client.get(`/api/entity/etablissements?${params}`);
        return response.data;
      } catch (e) {
        throw new ApiError(this.name, e.message, e.code || (e.response && e.response.status));
      }
    });
  }

  getEtablissementsFromAnnuaire(query) {
    return this.execute(async (client) => {
      try {
        let params = queryString.stringify(query);

        logger.debug(`[${this.name}] Fetching établissements from annuaire with params ${params}...`);
        let response = await client.get(`/api/v1/annuaire/etablissements?${params}`);
        return response.data;
      } catch (e) {
        throw new ApiError(this.name, e.message, e.code || (e.response && e.response.status));
      }
    });
  }
}

module.exports = TablesCorrespondancesApi;
