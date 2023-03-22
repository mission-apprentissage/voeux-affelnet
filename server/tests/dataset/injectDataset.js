const faker = require("@faker-js/faker/locale/fr").faker;
const { Mef, JobEvent } = require("../../src/common/model");
const sendConfirmationEmails = require("../../src/jobs/sendConfirmationEmails");
const sendActivationEmails = require("../../src/jobs/sendActivationEmails");
const { createUAI } = require("../../src/common/utils/validationUtils");
const importMefs = require("../../src/jobs/importMefs");
const { insertGestionnaire, insertFormateur, insertVoeu } = require("../utils/fakeData");
const { range } = require("lodash");
const { insertDossier, createUsername, createEmail } = require("../utils/fakeData.js");
const { createAdmin } = require("../../src/jobs/createAdmin.js");
const { createCsaio } = require("../../src/jobs/createCsaio.js");
const logger = require("../../src/common/logger.js");

async function generateFormateurs(uais) {
  const stats = uais.map(async (uai) => await insertFormateur({ uai }));
  await JobEvent.create({ job: "importFormatiions", stats });
}

async function generateVoeux(uais, options = {}) {
  const nbVoeux = 25;
  const { mef, code_formation_diplome, libelle_long } = await Mef.findOne({ mef: "3112320121" });

  logger.info(`Generating ${uais.length * nbVoeux} voeux...`);
  const stats = await Promise.all(
    uais.flatMap((uai) => {
      return range(0, nbVoeux).flatMap(() => {
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

async function generateGestionnaire(sendEmail, uais) {
  const siret = faker.helpers.replaceSymbols("#########00015");

  logger.info(`Generating CFA ${siret}...`);
  const stats = await insertGestionnaire({
    siret,
    etablissements: uais.map((uai) => {
      return { uai, voeux_date: new Date() };
    }),
  });
  await JobEvent.create({ job: "importGestionnaires", stats });
  await generateFormateurs(uais);
  await sendConfirmationEmails(sendEmail, { username: siret });

  return { siret };
}

async function generateAdmin(sendEmail) {
  const username = createUsername();

  await createAdmin(username, createEmail());
  await sendActivationEmails(sendEmail, { username });
}

async function generateCsaio(sendEmail) {
  const username = createUsername();

  await createCsaio(username, createEmail(), "11");
  await sendActivationEmails(sendEmail, { username });
}

async function injectDataset(actions, options = {}) {
  let { sendEmail } = actions;
  const uais = range(0, 2).map(() => createUAI(faker.helpers.replaceSymbols("075####")));

  if (options.mef) {
    await importMefs();
  }

  if (options.admin) {
    await generateAdmin(sendEmail);
  }

  if (options.csaio) {
    await generateCsaio(sendEmail);
  }

  if (options.gestionnaire) {
    await generateGestionnaire(sendEmail, uais);
  }

  await generateVoeux(uais, options);
}

module.exports = { injectDataset };
