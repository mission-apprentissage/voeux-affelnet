const logger = require("../../common/logger").child({ context: "script" });
const prettyMilliseconds = require("pretty-ms");
const { isEmpty } = require("lodash");
const { connectToMongo, closeMongoConnection } = require("../../common/mongodb");
const createActions = require("../../actions");

process.on("unhandledRejection", (e) => logger.error(e));
process.on("uncaughtException", (e) => logger.error(e));
process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
});

const createTimer = () => {
  let launchTime;
  return {
    start: () => {
      launchTime = new Date().getTime();
    },
    stop: (results) => {
      const duration = prettyMilliseconds(new Date().getTime() - launchTime);
      const data = results && results.toJSON ? results.toJSON() : results;
      if (!isEmpty(data)) {
        logger.info(JSON.stringify(data, null, 2));
      }
      logger.info(`Completed in ${duration}`);
    },
  };
};

const exit = async (scriptError) => {
  if (scriptError) {
    logger.error(scriptError.constructor.name === "EnvVarError" ? scriptError.message : scriptError);
    process.exitCode = 1;
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongoConnection().catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
  }, 250);
};

async function runScript(job) {
  try {
    const timer = createTimer();
    timer.start();

    await connectToMongo();
    const actions = await createActions();

    const results = await job(actions);

    timer.stop(results);
    await exit();
  } catch (e) {
    await exit(e);
  }
}

module.exports = { runScript };
