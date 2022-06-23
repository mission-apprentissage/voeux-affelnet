const faker = require("@faker-js/faker/locale/fr").faker;
const { Mef, JobEvent } = require("../../src/common/model");
const sendConfirmationEmails = require("../../src/jobs/sendConfirmationEmails");
const sendActivationEmails = require("../../src/jobs/sendActivationEmails");
const { createUAI } = require("../../src/common/utils/validationUtils");
const importMefs = require("../../src/jobs/importMefs");
const { insertCfa, insertUfa, insertVoeu } = require("../utils/fakeData");
const { range } = require("lodash");
const { insertDossier } = require("../utils/fakeData.js");
const { createAdmin } = require("../../src/jobs/createAdmin.js");
const { createCsaio } = require("../../src/jobs/createCsaio.js");

async function generateUfas(uais) {
  const stats = uais.map(async (uai) => await insertUfa({ uai }));
  await JobEvent.create({ job: "importUfas", stats });
}

async function generateCfa(uais, custom = {}) {
  const stats = await insertCfa({
    etablissements: uais.map((uai) => {
      return { uai, voeux_date: new Date() };
    }),
    ...custom,
  });
  await JobEvent.create({ job: "importCfas", stats });
}

async function generateVoeux(uais, options = {}) {
  const { mef, code_formation_diplome, libelle_long } = await Mef.findOne({ mef: "3112320121" });

  const stats = await Promise.all(
    uais.flatMap((uai) => {
      return range(0, 25).flatMap(() => {
        const ine = faker.helpers.replaceSymbols("#########??");
        return [
          insertVoeu({
            apprenant: {
              ine,
            },
            etablissement_accueil: { uai },
            formation: { mef, code_formation_diplome, libelle_long },
            academie: { code: "01", nom: "Paris" },
          }),
          ...(options.csaio
            ? [
                insertDossier({
                  ine_apprenant: ine,
                  formation_cfd: code_formation_diplome,
                  uai_etablissement: uai,
                  statut: "inconnu",
                }),
              ]
            : []),
        ];
      });
    })
  );
  await JobEvent.create({ job: "importVoeux", stats });
}

async function generateCfaAndVoeux(cfa, options) {
  const siret = faker.helpers.replaceSymbols("#########00015");
  const uais = range(0, 2).map(() => createUAI(faker.helpers.replaceSymbols("075####")));

  await generateCfa(uais, {
    ...cfa,
    siret,
  });
  await generateUfas(uais);
  await generateVoeux(uais, options);

  return { siret, uais };
}

async function generateAdmin(sendEmail) {
  const username = faker.internet.userName();

  await createAdmin(username, faker.internet.email());
  await sendActivationEmails(sendEmail, { username });
}

async function generateCsaio(sendEmail) {
  const username = faker.internet.userName();

  await createCsaio(username, faker.internet.email(), "11");
  await sendActivationEmails(sendEmail, { username });
}

async function injectDataset(actions, options = {}) {
  let { sendEmail } = actions;

  if (options.mef) {
    await importMefs();
  }

  if (options.admin) {
    await generateAdmin(sendEmail);
  }

  if (options.csaio) {
    await generateCsaio(sendEmail);
  }

  let { siret } = await generateCfaAndVoeux(options);
  await sendConfirmationEmails(sendEmail, { username: siret });
}

module.exports = { injectDataset };
