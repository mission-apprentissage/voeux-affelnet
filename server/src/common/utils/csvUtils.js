const { parse } = require("csv-parse");

function parseCsv(options = {}) {
  return parse({
    delimiter: ";",
    trim: true,
    columns: true,
    ...options,
  });
}

module.exports = {
  parseCsv,
};
