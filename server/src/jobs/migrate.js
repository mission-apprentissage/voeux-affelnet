const { JobEvent } = require("../common/model");
const logger = require("../common/logger");
const { promiseAllProps } = require("../common/utils/asyncUtils");
const { Dossier } = require("../common/model/index.js");

const VERSION = 27;

async function addImportDateToDossiers() {
  let updated = 0;

  const res = await Dossier.updateMany(
    {},
    {
      $push: {
        "_meta.import_dates": { $each: [new Date("2022-07-04T00:00:00.000Z"), new Date("2022-08-15T00:00:00.000Z")] },
      },
    },
    { upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  updated += res.modifiedCount || 0;

  return { updated };
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
    addImportDateToDossiers: addImportDateToDossiers(),
  });
}

module.exports = migrate;
