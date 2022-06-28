// eslint-disable-next-line no-unused-vars
const { User, JobEvent } = require("../common/model");
const logger = require("../common/logger");
const { promiseAllProps } = require("../common/utils/asyncUtils");
// eslint-disable-next-line no-unused-vars
const { raw } = require("../common/utils/mongooseUtils");
const { Cfa } = require("../common/model/index.js");

const VERSION = 26;

async function fixDate() {
  let updated = 0;
  let array = await raw(Cfa)
    .find({
      $or: [
        { "voeux_telechargements.date": { $type: "object" } },
        { "etablissements.voeux_date": { $type: "object" } },
        { "emails.sendDates": { $elemMatch: { $type: "object" } } },
        { "anciens_emails.modification_date": { $type: "object" } },
      ],
    })
    .stream();

  for await (const cfa of array) {
    cfa.voeux_telechargements = cfa.voeux_telechargements.map((t) => {
      if (!t.date["$date"]) {
        return t;
      }

      return {
        ...t,
        date: new Date(t.date["$date"]),
      };
    });

    cfa.etablissements = cfa.etablissements.map((e) => {
      if (!e.voeux_date["$date"]) {
        return e;
      }

      return {
        ...e,
        voeux_date: new Date(e.voeux_date["$date"]),
      };
    });

    cfa.anciens_emails = cfa.anciens_emails.map((ancien) => {
      if (!ancien.modification_date["$date"]) {
        return ancien;
      }

      return {
        ...ancien,
        modification_date: new Date(ancien.modification_date["$date"]),
      };
    });

    cfa.emails = cfa.emails.map((e) => {
      return {
        ...e,
        sendDates: (e.sendDates || []).map((d) => {
          if (!d["$date"]) {
            return d;
          }

          return new Date(d["$date"]);
        }),
      };
    });

    await raw(Cfa).replaceOne({ siret: cfa.siret }, cfa);
    updated++;
  }

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
    fixDate: fixDate(),
  });
}

module.exports = migrate;
