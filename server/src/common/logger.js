const util = require("util");
const { throttle } = require("lodash");
const bunyan = require("bunyan");
const PrettyStream = require("bunyan-prettystream");
const BunyanSlack = require("bunyan-slack");
const BunyanMongodbStream = require("bunyan-mongodb-stream");
const config = require("../config");
const { Log } = require("./model/index");

function consoleStream(outputName) {
  const { level, format } = config.log;
  let output = process[outputName];
  let stream = output;
  if (format === "pretty") {
    stream = new PrettyStream();
    stream.pipe(output);
  }

  return {
    name: outputName,
    level,
    stream,
  };
}

function mongoDBStream() {
  return {
    name: "mongodb",
    level: "info",
    stream: BunyanMongodbStream({ model: Log }),
  };
}

function slackStream() {
  const stream = new BunyanSlack(
    {
      webhook_url: config.slackWebhookUrl,
      customFormatter: (record, levelName) => {
        if (record.type === "http") {
          record = {
            url: record.request.url.relative,
            statusCode: record.response.statusCode,
            ...(record.error ? { message: record.error.message } : {}),
          };
        }
        return {
          text: util.format(`[%s][${config.env}] %O`, levelName.toUpperCase(), record),
        };
      },
    },
    (error) => {
      console.error("Unable to send log to slack", error);
    }
  );

  stream.write = throttle(stream.write, 5000);

  return {
    name: "slack",
    level: "error",
    stream,
  };
}

const createStreams = () => {
  let availableDestinations = {
    stdout: () => consoleStream("stdout"),
    stderr: () => consoleStream("stderr"),
    mongodb: () => mongoDBStream(),
    slack: () => slackStream(),
  };

  return config.log.destinations.split(",").map((type) => availableDestinations[type]());
};

module.exports = bunyan.createLogger({
  name: "voeux-affelnet",
  serializers: bunyan.stdSerializers,
  streams: createStreams(),
});
