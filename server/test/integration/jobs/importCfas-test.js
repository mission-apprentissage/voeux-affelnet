const assert = require("assert");
const importCfas = require("../../../src/jobs/importCfas");
const { Cfa } = require("../../../src/common/model");
const integrationTests = require("../utils/integrationTests");
const { createStream } = require("../utils/testUtils");
const { insertVoeu } = require("../utils/fakeData");
const FakeReferentielApi = require("../utils/FakeReferentielApi");

const fakeReferentielApi = new FakeReferentielApi({
  11111111100006: {
    adresse: {
      academie: {
        code: "16",
        nom: "Toulouse",
      },
    },
  },
});

integrationTests(__filename, () => {
  it.only("Vérifie qu'on peut importer un cfa", async () => {
    let cfaCsv = createStream(`siret;raison_sociale;email;email_source
11111111100006;Lycée professionnel;contact@lycee.fr;rco`);
    let relationsCsv = createStream(`UAI;SIRET_UAI_GESTIONNAIRE
0751234J;11111111100006`);

    let stats = await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const found = await Cfa.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found, {
      type: "Cfa",
      username: "11111111100006",
      siret: "11111111100006",
      email: "contact@lycee.fr",
      email_source: "rco",
      academie: { nom: "Toulouse", code: "16" },
      raison_sociale: "Lycée professionnel",
      emails: [],
      contacts: [],
      etablissements: [{ uai: "0751234J" }],
      voeux_telechargements: [],
      isAdmin: false,
      statut: "en attente",
      unsubscribe: false,
    });
    assert.deepStrictEqual(stats, { total: 1, created: 1, updated: 0, invalid: 0, failed: 0 });
  });

  it.only("Vérifie si le cfa a des voeux", async () => {
    let cfaCsv = createStream(`siret;raison_sociale;email;email_source
11111111100006;Lycée professionnel;contact@lycee.fr;rco`);
    let relationsCsv = createStream(`UAI;SIRET_UAI_GESTIONNAIRE
0751234J;11111111100006`);
    let date = new Date();
    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
      },
      _meta: {
        import_dates: [date],
      },
    });

    await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const found = await Cfa.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.etablissements[0].voeux_date, date);
  });

  it.only("Vérifie qu'on peut ignorer les cfas invalides (pas d'emails)", async () => {
    let cfaCsv = createStream(`siret;raison_sociale;email;email_source
11111111100006;Lycée professionnel;;rco`);
    let relationsCsv = createStream(`UAI;SIRET_UAI_GESTIONNAIRE
0751234J;11111111100006`);

    let stats = await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const count = await Cfa.countDocuments({ siret: "11111111100006" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 1, failed: 0 });
  });

  it.only("Vérifie qu'on peut mettre à jour uniquement certaines des informations", async () => {
    await importCfas(
      createStream(`siret;raison_sociale;email;email_source
11111111100006;Lycée professionnel 1;contact@lycee.fr;rco`),
      {
        referentielApi: fakeReferentielApi,
        relationsCsv: createStream(`UAI;SIRET_UAI_GESTIONNAIRE
0751234J;11111111100006`),
      }
    );

    let stats = await importCfas(
      createStream(`siret;raison_sociale;email;email_source
11111111100006;Lycée professionnel 2;contact@lycee.fr;rco`),
      {
        referentielApi: fakeReferentielApi,
        relationsCsv: createStream(`UAI;SIRET_UAI_GESTIONNAIRE
0751234J;11111111100006
0751234X;11111111100006
`),
      }
    );

    const found = await Cfa.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.raison_sociale, "Lycée professionnel 2");
    assert.deepStrictEqual(
      found.etablissements.map((e) => e.uai),
      ["0751234J", "0751234X"]
    );
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 1, invalid: 0, failed: 0 });
  });
});
