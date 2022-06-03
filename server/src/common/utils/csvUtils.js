const { parse } = require("csv-parse");

function parseCsv(options = {}) {
  return parse({
    delimiter: ";",
    trim: true,
    columns: true,
    ...options,
  });
}

function ouiNon(v) {
  return v ? "Oui" : "Non";
}

module.exports = {
  parseCsv,
  ouiNon,
};
