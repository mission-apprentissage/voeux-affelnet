const faker = require("faker/locale/fr");
const { Mef, JobEvent } = require("../../common/model");
const fakeVoeuxCsv = require("./fakes/fakeVoeuxCsv");
const fakeCfaCsv = require("./fakes/fakeCfaCsv");
const importMefs = require("../importMefs");
const importCfas = require("../importCfas");
const importVoeux = require("../importVoeux");
const createUser = require("../createUser");
const sendConfirmationEmails = require("../sendConfirmationEmails");
const sendActivationEmails = require("../sendActivationEmails");

async function generateCfaAndVoeux(custom, options = {}) {
  let uai = faker.helpers.replaceSymbols("#######?");

  let stats = await importCfas(fakeCfaCsv(1, { ...custom, uai }));
  await JobEvent.create({
    job: "importCfas",
    stats,
  });

  let { mef, libelle_long } = await Mef.findOne({ mef: "3112320121" });
  stats = await importVoeux(
    fakeVoeuxCsv(options.limit || 100, {
      "Code UAI étab. Accueil": uai,
      "Code MEF": mef,
      "Libellé formation": libelle_long,
    })
  );
  await JobEvent.create({
    job: "importVoeux",
    stats,
  });
}

async function injectDataset(emails, options = {}) {
  await importMefs();
  await generateCfaAndVoeux({ email_contact: faker.internet.email(), email_directeur: null }, options);
  await generateCfaAndVoeux({ email_contact: null, email_directeur: faker.internet.email() }, options);
  await sendConfirmationEmails(emails);

  await createUser(faker.internet.userName(), faker.internet.email(), { admin: true });
  await sendActivationEmails(emails);
}

module.exports = injectDataset;
