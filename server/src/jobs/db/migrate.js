// eslint-disable-next-line no-unused-vars
const { User, JobEvent } = require("../../common/model");
const logger = require("../../common/logger");
const { promiseAllProps } = require("../../common/utils/asyncUtils");
// eslint-disable-next-line no-unused-vars
const { raw } = require("../../common/utils/mongooseUtils");

const VERSION = 25;

async function removeWriteable() {
  const { result } = await raw(User).updateMany(
    {},
    {
      $set: {
        writeable: true,
      },
    }
  );

  return result.nModified;
}

async function hasAlreadyBeenExecuted() {
  const count = await JobEvent.countDocuments({ job: "migrate", "stats.version": VERSION });
  return count > 0;
}

async function migrate() {
  if (await hasAlreadyBeenExecuted()) {
    logger.warn("Migration script has already been executed");
    return;
  }

  return promiseAllProps({
    version: VERSION,
    resetEmails: Promise.all([]),
    removeWriteable: removeWriteable(),
  });
}

module.exports = migrate;
