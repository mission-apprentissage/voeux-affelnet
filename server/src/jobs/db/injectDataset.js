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
const FakeReferentielApi = require("../../../tests/utils/FakeReferentielApi");
const { createStream } = require("../../../tests/utils/testUtils");

async function generateCfa(uaiEtablissement, values = {}) {
  const siret = faker.helpers.replaceSymbols("#########00015");
  const stats = await importCfas(fakeCfaCsv({ siret, ...values }, { limit: 1 }), {
    relationsCsv: createStream(`UAI;SIRET_UAI_GESTIONNAIRE\n${uaiEtablissement};${siret}`),
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

async function generateVoeux(values, options) {
  const stats = await importVoeux(fakeVoeuxCsv(values, options));
  await JobEvent.create({ job: "importVoeux", stats });
}

async function injectDataset(emails, options = {}) {
  const uai = faker.helpers.replaceSymbols("#######?");

  await importMefs();

  await generateCfa(uai);
  await sendConfirmationEmails(emails);

  const { mef, libelle_long } = await Mef.findOne({ mef: "3112320121" });
  await generateVoeux(
    {
      "Code UAI étab. Accueil": uai,
      "Code MEF": mef,
      "Libellé formation": libelle_long,
    },
    { limit: options.limit }
  );

  await createUser(faker.internet.userName(), faker.internet.email(), { admin: true });
  await sendActivationEmails(emails);
}

module.exports = injectDataset;
