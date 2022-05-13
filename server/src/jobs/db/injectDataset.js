const faker = require("faker/locale/fr");
const { Mef, JobEvent } = require("../../common/model");
const { fakeVoeuxCsv } = require("./fakes/fakeVoeuxCsv");
const { fakeRelationsCsv } = require("./fakes/fakeRelationsCsv");
const { fakeCfaCsv } = require("./fakes/fakeCfaCsv");
const importCfas = require("../importCfas");
const importVoeux = require("../importVoeux");
const createUser = require("../createUser");
const sendConfirmationEmails = require("../sendConfirmationEmails");
const sendActivationEmails = require("../sendActivationEmails");
const FakeReferentielApi = require("../../../tests/utils/FakeReferentielApi");
const { createUAI } = require("../../common/utils/validationUtils");
const importMefs = require("../importMefs");

async function generateCfa(uais, values = {}) {
  const siret = faker.helpers.replaceSymbols("#########00015");

  const stats = await importCfas(fakeCfaCsv({ siret, ...values }, { limit: 1 }), {
    relationsCsv: fakeRelationsCsv(siret, uais),
    referentielApi: new FakeReferentielApi({
      siret,
      adresse: {
        academie: {
          code: "16",
          nom: "Toulouse",
        },
      },
    }),
  });
  await JobEvent.create({ job: "importCfas", stats });
}

async function generateVoeux(values) {
  const stats = await importVoeux(fakeVoeuxCsv(values, { limit: 25 }));
  await JobEvent.create({ job: "importVoeux", stats });
}

async function injectDataset(sendEmail) {
  const uais = [createUAI(faker.helpers.replaceSymbols("075####")), createUAI(faker.helpers.replaceSymbols("075####"))];

  await importMefs();

  await generateCfa(uais);
  await sendConfirmationEmails(sendEmail);

  const { mef, libelle_long } = await Mef.findOne({ mef: "3112320121" });
  await Promise.all(
    uais.map((uai) => {
      return generateVoeux({ "Code UAI étab. Accueil": uai, "Code MEF": mef, "Libellé formation": libelle_long });
    })
  );

  await createUser(faker.internet.userName(), faker.internet.email(), { admin: true });
  await sendActivationEmails(sendEmail);
}

module.exports = { injectDataset };
