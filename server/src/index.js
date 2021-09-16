require("dotenv").config();
const server = require("./http/server");
const logger = require("./common/logger");
const createComponents = require("./components");

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  let components = await createComponents();

  let http = await server(components);
  http.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`));
})();
