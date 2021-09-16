const { Duration } = require("luxon");
const { program: cli } = require("commander");
const Confirm = require("prompt-confirm");
const { closeMongoConnection } = require("../../common/mongodb");
const { JobEvent } = require("../../common/model");
const createComponents = require("../../components");
const logger = require("../../common/logger");
const config = require("../../config");
let { access, mkdir } = require("fs").promises;

const createTimer = () => {
  let launchTime;
  return {
    start: () => {
      launchTime = new Date().getTime();
    },
    stop: (results) => {
      let duration = Duration.fromMillis(new Date().getTime() - launchTime);
      let data = results && results.toJSON ? results.toJSON() : results;
      if (data) {
        logger.info(JSON.stringify(data, null, 2));
      }
      logger.info(`Completed in ${duration.as("seconds")}s`);
    },
  };
};

let ensureOutputDirExists = async () => {
  let outputDir = config.outputDir;
  try {
    await access(outputDir);
  } catch (e) {
    if (e.code !== "EEXIST") {
      await mkdir(outputDir, { recursive: true });
    }
  }
  return outputDir;
};

const exit = async (rawError) => {
  let error = rawError;
  if (rawError) {
    logger.error(rawError.constructor.name === "EnvVarError" ? rawError.message : rawError);
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongoConnection()
      .then(() => {})
      .catch((closeError) => {
        error = closeError;
        console.error(error);
      });
  }, 250);

  process.exitCode = error ? 1 : 0;
};

module.exports = {
  question: (message, options = {}) => {
    let prompt = new Confirm({
      message,
      default: false,
      ...options,
    });

    return new Promise((resolve) => {
      prompt.ask((answer) => resolve(answer));
    });
  },
  runScript: async (job) => {
    try {
      let timer = createTimer();
      timer.start();

      await ensureOutputDirExists();
      let components = await createComponents();
      let results = await job(components);

      if (results) {
        await JobEvent.create({
          job: cli.args[0],
          stats: results,
        });
      }

      timer.stop(results);
      await exit();
    } catch (e) {
      await exit(e);
    }
  },
};
