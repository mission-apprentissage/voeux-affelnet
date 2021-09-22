const queryString = require("query-string");
const logger = require("../logger");
const ApiError = require("./ApiError");
const RateLimitedApi = require("./RateLimitedApi");

class CatalogueApi extends RateLimitedApi {
  constructor(options = {}) {
    super("CatalogueApi", "https://catalogue.apprentissage.beta.gouv.fr", options);
  }

  getFormations(query, { annee, ...options }) {
    return this.execute(async (client) => {
      try {
        let params = queryString.stringify(
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

        let version = `${annee || ""}`;
        logger.debug(`[Catalogue API] Fetching formations ${version} with params ${params}...`);
        let response = await client.get(`api/entity/formations${version}?${params}`);
        return response.data;
      } catch (e) {
        throw new ApiError("Api Catalogue", e.message, e.code || e.response.status);
      }
    });
  }
}

module.exports = CatalogueApi;
