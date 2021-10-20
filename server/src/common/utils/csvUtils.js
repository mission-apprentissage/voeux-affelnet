const csv = require("csv-parse");

function parseCsv(options = {}) {
  return csv({
    delimiter: ";",
    trim: true,
    columns: true,
    ...options,
  });
}

module.exports = {
  parseCsv,
};
