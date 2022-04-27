const { mergeWith, isEmpty } = require("lodash");
const faker = require("faker/locale/fr");
const { Readable } = require("stream");
const { oleoduc, transformIntoCSV } = require("oleoduc");

function newLine(custom = {}) {
  return mergeWith(
    {},
    {
      uai: faker.helpers.replaceSymbols("075####?"),
      siret: faker.helpers.replaceSymbols("#########00015"),
      raison_sociale: faker.company.companyName(),
      email_directeur: faker.internet.email(),
      email_contact: faker.internet.email(),
      ...custom,
    },
    custom,
    (o, s) => (isEmpty(s) ? o : s)
  );
}

function fakeCfaCsv(limit, custom) {
  let cpt = 0;
  let source = new Readable({
    objectMode: true,
    read() {
      if (++cpt > limit) {
        return this.push(null);
      }

      return this.push(newLine(custom));
    },
  });

  return oleoduc(source, transformIntoCSV({ separator: ";" }));
}

module.exports = fakeCfaCsv;
