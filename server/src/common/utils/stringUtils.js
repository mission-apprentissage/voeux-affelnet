const { DateTime } = require("luxon");

function dateAsString(date) {
  return DateTime.fromJSDate(date).setLocale("fr").toFormat("yyyy-MM-dd");
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = { dateAsString, capitalizeFirstLetter };
