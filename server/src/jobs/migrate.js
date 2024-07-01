const { JobEvent } = require("../common/model");
const logger = require("../common/logger");
const { Voeu, Csaio } = require("../common/model");
const { raw } = require("../common/utils/mongooseUtils.js");
const { findRegionByCode } = require("../common/regions.js");

const VERSION = 28;

async function tasks() {
  const users = await raw(Csaio)
    .find({ type: "Csaio", region: { $exists: true } })
    .toArray();
  const convertCsaio = await Promise.all(
    users.map((user) => {
      return Csaio.updateOne(
        { _id: user._id },
        {
          academies: findRegionByCode(user.region.code).academies,
        }
      );
    })
  );

  return {
    convertCsaio,
    addPreviousMigration: await JobEvent.create({
      job: "migrate",
      date: new Date(),
      stats: {
        version: 27,
      },
    }),
    removeMetaAdresse: await raw(Voeu).updateMany(
      { "_meta.adresse": { $exists: true } },
      { $unset: { "_meta.adresse": 1 } }
    ),
  };
}

async function _hasAlreadyBeenExecuted() {
  const count = await JobEvent.countDocuments({ job: "migrate", "stats.version": VERSION });
  return count > 0;
}

async function _saveMigration() {
  await JobEvent.create({
    job: "migrate",
    date: new Date(),
    stats: {
      version: VERSION,
    },
  });
}

async function migrate() {
  if (await _hasAlreadyBeenExecuted()) {
    logger.warn("Migration script has already been executed");
    return;
  }

  const res = await tasks();

  await _saveMigration();

  return res;
}

module.exports = migrate;
