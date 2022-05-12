const { mergeWith, isEmpty } = require("lodash");
const faker = require("faker/locale/fr");
const { Readable } = require("stream");
const { oleoduc, transformIntoCSV } = require("oleoduc");

function newLine(custom = {}) {
  const siret = faker.helpers.replaceSymbols("#########00015");

  return mergeWith(
    {},
    {
      username: siret,
      siret: siret,
      raison_sociale: faker.company.companyName(),
      email: faker.internet.email(),
      ...custom,
    },
    custom,
    (o, s) => (isEmpty(s) ? o : s)
  );
}

function fakeCfaCsv(values, options = {}) {
  const limit = options.limit || 100;

  let cpt = 0;
  const source = new Readable({
    objectMode: true,
    read() {
      if (++cpt > limit) {
        return this.push(null);
      }

      return this.push(newLine(values));
    },
  });

  return oleoduc(source, transformIntoCSV({ separator: ";" }));
}

module.exports = fakeCfaCsv;
