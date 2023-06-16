const { parse } = require("csv-parse");
const { DateTime } = require("luxon");

const parseCsv = (options = {}) => {
  return parse({
    delimiter: ";",
    trim: true,
    columns: true,
    ...options,
  });
};

const date = (v) => {
  return v ? DateTime.fromJSDate(v).setLocale("en-gb").toLocaleString() : "";
};

const ouiNon = (v) => {
  return v ? "Oui" : "Non";
};

const number = (v) => {
  return v ? `${v}` : "0";
};

module.exports = {
  parseCsv,
  ouiNon,
  date,
  number,
};
