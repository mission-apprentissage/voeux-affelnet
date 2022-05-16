const faker = require("faker/locale/fr");
const { Mef, JobEvent } = require("../../src/common/model");
const createUser = require("../../src/jobs/createUser");
const sendConfirmationEmails = require("../../src/jobs/sendConfirmationEmails");
const sendActivationEmails = require("../../src/jobs/sendActivationEmails");
const { createUAI } = require("../../src/common/utils/validationUtils");
const importMefs = require("../../src/jobs/importMefs");
const { insertCfa, insertVoeu } = require("../utils/fakeData");
const { range } = require("lodash");

async function generateCfa(uais, custom = {}) {
  const stats = await insertCfa({
    etablissements: uais.map((uai) => {
      return { uai, voeux_date: new Date() };
    }),
    ...custom,
  });
  await JobEvent.create({ job: "importCfas", stats });
}

async function generateVoeux(uais) {
  const { mef, code_formation_diplome, libelle_long } = await Mef.findOne({ mef: "3112320121" });

  const stats = await Promise.all(
    uais.flatMap((uai) => {
      return range(0, 25).map(() => {
        return insertVoeu({
          etablissement_accueil: { uai },
          formation: { mef, code_formation_diplome, libelle_long },
        });
      });
    })
  );
  await JobEvent.create({ job: "importVoeux", stats });
}

async function generateCfaAndVoeux(cfa) {
  const siret = faker.helpers.replaceSymbols("#########00015");
  const uais = range(0, 2).map(() => createUAI(faker.helpers.replaceSymbols("075####")));

  await generateCfa(uais, {
    ...cfa,
    siret,
  });
  await generateVoeux(uais);

  return { siret, uais };
}

async function generateAdmin(sendEmail) {
  await createUser(faker.internet.userName(), faker.internet.email(), { admin: true });
  await sendActivationEmails(sendEmail);
}

async function injectDataset(actions, options = {}) {
  let { sendEmail } = actions;

  if (options.mef) {
    await importMefs();
  }

  if (options.admin) {
    await generateAdmin(sendEmail);
  }

  await generateCfaAndVoeux();
  await sendConfirmationEmails(sendEmail);
}

module.exports = { injectDataset };
