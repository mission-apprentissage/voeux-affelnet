const CatalogueApi = require("../../common/api/CatalogueApi.js");
// const logger = require("../../common/logger.js");

const catalogue = async () => {
  const catalogueApi = new CatalogueApi();

  await catalogueApi.connect();

  return {
    findFormation: async (params) => {
      try {
        const formation = await catalogueApi.getFormation(params);

        return formation;
      } catch (e) {
        return null;
      }
    },
  };
};

module.exports = { catalogue };
