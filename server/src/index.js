require("dotenv").config();
const server = require("./http/server");
const logger = require("./common/logger");
const createActions = require("./actions");
const { connectToMongo } = require("./common/mongodb");

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  await connectToMongo();
  let actions = await createActions();

  let http = await server(actions);
  http.listen(5000, () => logger.info(`Server ready and listening on port ${5000}`));
})();
