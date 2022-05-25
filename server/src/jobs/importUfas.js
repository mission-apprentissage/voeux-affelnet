const { oleoduc, filterData, writeData, transformData, compose } = require("oleoduc");
const Joi = require("@hapi/joi");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Ufa } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const { getDefaultUfaStream, transformUfaStream } = require("../common/relations");

const schema = Joi.object({
  uai: Joi.string().required(),
}).unknown();

async function importUfas(ufaCsv) {
  console.log("stream", ufaCsv);
  const stream = ufaCsv
    ? compose(
        ufaCsv,
        parseCsv({
          on_record: (record) => omitEmpty(record),
        }),
        transformData(transformUfaStream)
      )
    : await getDefaultUfaStream();

  // const referentielApi = options.referentielApi || new ReferentielApi();
  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  console.log("reading stream");
  await oleoduc(
    stream,
    filterData(async (json) => {
      console.log({ json });
      stats.total++;
      const { error } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return true;
      }

      stats.invalid++;
      logger.warn(`Le ufa ${json.uai} est invalide`, error);
      return false;
    }),
    writeData(
      async ({ uai, ...data }) => {
        try {
          const res = await Ufa.updateOne(
            { uai },
            {
              $setOnInsert: {
                uai,
              },
              $set: {
                ...data,
              },
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Ufa ${uai} created`);
          } else if (res.modifiedCount) {
            stats.updated++;
            logger.info(`Ufa ${uai} updated`);
          } else {
            logger.trace(`Ufa ${uai} déjà à jour`);
          }
        } catch (e) {
          stats.failed++;
          logger.error(`Impossible de traiter le ufa ${uai}`, e);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importUfas;
