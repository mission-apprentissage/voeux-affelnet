const { DateTime } = require("luxon");

function removeLine(data, regex) {
  return data
    .split("\n")
    .filter((val) => !regex.test(val))
    .join("\n");
}

function dateAsString(date) {
  return DateTime.fromJSDate(date).setLocale("fr").toFormat("yyyy-MM-dd");
}

module.exports = { removeLine, dateAsString };
