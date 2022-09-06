const RateLimitedApi = require("./RateLimitedApi");
const { fetchStream, fetchJson } = require("../utils/httpUtils.js");
const { compose } = require("oleoduc");
const { streamJsonArray } = require("../utils/streamUtils.js");
const config = require("../../config.js");
const logger = require("../logger.js");

class TableauDeBordApi extends RateLimitedApi {
  constructor(options = {}) {
    super("TableauDeBordApi", { nbRequests: 5, perSeconds: 1, ...options });
  }

  static get baseApiUrl() {
    return "https://cfas.apprentissage.beta.gouv.fr";
  }

  async login() {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Logging to metabase...`);
      const response = await fetchJson(`${TableauDeBordApi.baseApiUrl}/metabase/api/session`, {
        method: "POST",
        data: { username: config.tableauDeBord.username, password: config.tableauDeBord.password },
      });

      return response.id;
    });
  }

  async streamDossiers() {
    return this.execute(async () => {
      logger.debug(`[${this.name}] Fetching dossiers from tableau de bord...`);
      const sessionId = await this.login();

      const response = await fetchStream(`${TableauDeBordApi.baseApiUrl}/metabase/api/card/343/query/json`, {
        method: "POST",
        headers: {
          "X-Metabase-Session": sessionId,
        },
      });

      return compose(response, streamJsonArray());
    });
  }
}

module.exports = TableauDeBordApi;
