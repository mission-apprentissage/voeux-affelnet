const { DateTime } = require("luxon");

function toLocaleString(v) {
  return v ? DateTime.fromISO(v).toLocaleString() : "";
}

function sortAscending(a, b) {
  return DateTime.fromISO(a) - DateTime.fromISO(b);
}

function sortDescending(a, b) {
  return DateTime.fromISO(b) - DateTime.fromISO(a);
}

export { toLocaleString, sortAscending, sortDescending };
