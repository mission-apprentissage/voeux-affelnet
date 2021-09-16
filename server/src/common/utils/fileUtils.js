const { lock } = require("proper-lockfile");

async function lockfile(file, callback) {
  let release = await lock(file, {
    retries: {
      retries: 5,
      factor: 1,
      minTimeout: 250,
      maxTimeout: 1000,
      randomize: true,
    },
  });
  let res = await callback(file);
  await release();
  return res;
}

module.exports = { lockfile };
