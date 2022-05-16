const faker = require("faker/locale/fr");
const { Mef, JobEvent } = require("../../src/common/model");
const createUser = require("../../src/jobs/createUser");
const sendConfirmationEmails = require("../../src/jobs/sendConfirmationEmails");
const resendConfirmationEmails = require("../../src/jobs/resendConfirmationEmails");
const sendActivationEmails = require("../../src/jobs/sendActivationEmails");
const resendActivationEmails = require("../../src/jobs/resendActivationEmails");
const resendNotificationEmails = require("../../src/jobs/resendNotificationEmails");
const { createUAI } = require("../../src/common/utils/validationUtils");
const importMefs = require("../../src/jobs/importMefs");
const { insertCfa, insertVoeu } = require("../utils/fakeData");
const { range } = require("lodash");
const { DateTime } = require("luxon");

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

  await generateCfa(uais, cfa);
  await generateVoeux(uais);

  return { siret, uais };
}

async function generateUser(sendEmail) {
  await createUser(faker.internet.userName(), faker.internet.email(), { admin: true });
  await sendActivationEmails(sendEmail);
}

async function injectDataset(actions, options = {}) {
  let { sendEmail, resendEmail } = actions;

  if (options.mef) {
    await importMefs();
  }

  if (options.resend === "confirmation") {
    let { siret } = await generateCfaAndVoeux({
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 15 }).toJSDate()],
        },
      ],
    });
    await resendConfirmationEmails(resendEmail, { username: siret });
  } else if (options.resend === "activation") {
    let { siret } = await generateCfaAndVoeux({
      statut: "confirmé",
      emails: [
        {
          token: "TOKEN-1",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 20 }).toJSDate()],
          messageIds: ["messageId"],
        },
        {
          token: "TOKEN-2",
          templateName: "activation_cfa",
          sendDates: [DateTime.now().minus({ days: 15 }).toJSDate()],
        },
      ],
    });
    await resendActivationEmails(resendEmail, { username: siret });
  } else if (options.resend === "notification") {
    let { siret } = await generateCfaAndVoeux({
      statut: "activé",
      password: "fake",
      emails: [
        {
          token: "TOKEN-1",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 30 }).toJSDate()],
          messageIds: ["messageId"],
        },
        {
          token: "TOKEN-2",
          templateName: "activation_cfa",
          sendDates: [DateTime.now().minus({ days: 20 }).toJSDate()],
        },
        {
          token: "TOKEN-2",
          templateName: "notification",
          sendDates: [DateTime.now().minus({ days: 10 }).toJSDate()],
        },
      ],
    });
    await resendNotificationEmails(resendEmail, { username: siret });
  } else {
    await generateCfaAndVoeux();
    await sendConfirmationEmails(sendEmail);

    await generateUser(sendEmail);
  }
}

module.exports = { injectDataset };
