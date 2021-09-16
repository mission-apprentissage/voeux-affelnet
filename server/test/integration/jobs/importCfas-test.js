const assert = require("assert");
const importCfas = require("../../../src/jobs/importCfas");
const { Cfa } = require("../../../src/common/model");
const integrationTests = require("../utils/integrationTests");
const { createStream } = require("../utils/testUtils");
const { insertVoeu } = require("../utils/fakeData");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut importer un cfa (directeur)", async () => {
    let cfaCsv = createStream(`uai;siret;raison_sociale;email_directeur;email_contact
0751234J;11111111111111;Lycée professionnel;directeur@lycee.fr;`);

    let stats = await importCfas(cfaCsv);

    const found = await Cfa.findOne({ uai: "0751234J" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found, {
      type: "Cfa",
      username: "0751234J",
      email: "directeur@lycee.fr",
      academie: { nom: "Paris", code: "01" },
      siret: "11111111111111",
      raison_sociale: "Lycée professionnel",
      uai: "0751234J",
      emails: [],
      contacts: [],
      voeux_telechargements: [],
      isAdmin: false,
      email_source: "directeur",
      statut: "en attente",
      unsubscribe: false,
    });
    assert.deepStrictEqual(stats, { total: 1, created: 1, updated: 0, invalid: 0, failed: 0 });
  });

  it("Vérifie qu'on peut importer un cfa (contact)", async () => {
    let cfaCsv = createStream(`uai;siret;raison_sociale;email_directeur;email_contact
0751234J;11111111111111;Lycée professionnel;;contact@lycee.fr`);

    await importCfas(cfaCsv);

    const found = await Cfa.findOne({ uai: "0751234J" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.email, "contact@lycee.fr");
  });

  it("Vérifie si le cfa a des voeux", async () => {
    let cfaCsv = createStream(`uai;siret;raison_sociale;email_directeur;email_contact
0751234J;11111111111111;Lycée professionnel;;contact@lycee.fr`);
    let date = new Date();
    await insertVoeu({
      "etablissement_accueil.uai": "0751234J",
      _meta: {
        import_dates: [date],
      },
    });

    await importCfas(cfaCsv);

    const found = await Cfa.findOne({ uai: "0751234J" }, { _id: 0 }).lean();
    assert.ok(found.voeux_date);
    assert.deepStrictEqual(found.voeux_date, date);
  });

  it("Vérifie qu'on peut ignorer les cfas invalides (pas d'emails)", async () => {
    let cfaCsv = createStream(`uai;siret;raison_sociale;directeur;email_directeur;email_contact
0751234J;11111111111111;Lycée professionnel;;;`);

    let stats = await importCfas(cfaCsv);

    const count = await Cfa.countDocuments({ uai: "0751234J" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 1, failed: 0 });
  });

  it("Vérifie qu'on peut mettre à jour uniquement certaines des informations", async () => {
    await importCfas(
      createStream(`uai;siret;raison_sociale;directeur;email_directeur;email_contact
0751234J;11111111111111;Lycée professionnel;Robert Hue;directeur@lycee.fr;`)
    );

    let stats = await importCfas(
      createStream(`uai;siret;raison_sociale;email_directeur;email_contact
0751234J;11111111100001;Collège professionnel;NEW@lycee.fr;`)
    );

    const found = await Cfa.findOne({ uai: "0751234J" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found, {
      type: "Cfa",
      username: "0751234J",
      email: "directeur@lycee.fr",
      siret: "11111111100001",
      raison_sociale: "Collège professionnel",
      academie: { nom: "Paris", code: "01" },
      uai: "0751234J",
      emails: [],
      voeux_telechargements: [],
      isAdmin: false,
      email_source: "directeur",
      contacts: [],
      unsubscribe: false,
      statut: "en attente",
    });
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 1, invalid: 0, failed: 0 });
  });
});
