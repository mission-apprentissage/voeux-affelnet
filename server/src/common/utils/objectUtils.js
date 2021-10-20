const { pickBy, isEmpty, isObject } = require("lodash");

function omitEmpty(obj) {
  return pickBy(obj, (v) => !isEmpty(v));
}

function deepOmitEmpty(obj) {
  for (var propName in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, propName) && isEmpty(obj[propName])) {
      delete obj[propName];
    } else if (isObject(obj[propName])) {
      deepOmitEmpty(obj[propName]);
    }
  }
  return obj;
}

function trimValues(obj) {
  return Object.keys(obj).reduce((acc, curr) => {
    acc[curr] = obj[curr].trim();
    return acc;
  }, {});
}

function flattenObject(obj, parent, res = {}) {
  for (let key in obj) {
    let propName = parent ? parent + "." + key : key;
    if (
      Object.prototype.hasOwnProperty.call(obj, propName) &&
      typeof obj[key] == "object" &&
      !Array.isArray(obj[key])
    ) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

function optionalItem(key, value) {
  return value ? [{ [key]: value }] : [];
}

function optionalObject(key, value) {
  return value ? { [key]: value } : {};
}

module.exports = {
  omitEmpty,
  deepOmitEmpty,
  trimValues,
  flattenObject,
  optionalObject,
  optionalItem,
};
