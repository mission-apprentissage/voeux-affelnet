const { isPlainObject, zipObject, keys, values } = require("lodash");

module.exports = {
  asyncForEach: async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  },
  promiseAllProps: async (data) => {
    if (isPlainObject(data)) {
      return zipObject(keys(data), await Promise.all(values(data)));
    }
    return Promise.all(data);
  },
  delay: (milliseconds) => {
    return new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
  },
};
