const axios = require("axios");
const queryString = require("query-string");
const logger = require("../logger");
const ApiError = require("./ApiError");
const RateLimitedApi = require("./RateLimitedApi");

class CatalogueApi extends RateLimitedApi {
  constructor(options = {}) {
    super("CatalogueApi", options);
    this.client =
      options.axios ||
      axios.create({
        baseURL: "https://catalogue.apprentissage.beta.gouv.fr",
        timeout: 10000,
      });
  }

  getFormations(params, { annee, ...options }) {
    return this.execute(async () => {
      try {
        let query = queryString.stringify(
          {
            query: JSON.stringify(params),
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
        logger.debug(`[Catalogue API] Fetching formations ${version} with params ${query}...`);
        let response = await this.client.get(`api/entity/formations${version}?${query}`);
        return response.data;
      } catch (e) {
        throw new ApiError("Api Catalogue", e.message, e.code || e.response.status);
      }
    });
  }
}

module.exports = CatalogueApi;
