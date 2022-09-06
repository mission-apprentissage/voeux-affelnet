const { compose, transformData } = require("oleoduc");
const Pick = require("stream-json/filters/Pick");
const { parser: jsonParser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");

function streamJsonArray() {
  return compose(
    jsonParser(),
    streamArray(),
    transformData((data) => data.value)
  );
}

function streamNestedJsonArray(arrayPropertyName) {
  return compose(
    Pick.withParser({ filter: arrayPropertyName }),
    streamArray(),
    transformData((data) => data.value)
  );
}

module.exports = {
  streamNestedJsonArray,
  streamJsonArray,
};
