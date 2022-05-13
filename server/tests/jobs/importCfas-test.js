const assert = require("assert");
const importCfas = require("../../src/jobs/importCfas");
const { Cfa } = require("../../src/common/model");
const { insertVoeu } = require("../utils/fakeData");
const FakeReferentielApi = require("../utils/FakeReferentielApi");
const { createStream } = require("../utils/testUtils");

const fakeReferentielApi = new FakeReferentielApi([
  {
    siret: "11111111100006",
    raison_sociale: "Lycée professionnel",
    adresse: {
      academie: {
        code: "16",
        nom: "Toulouse",
      },
    },
  },
]);

describe("importCfas", () => {
  it("Vérifie qu'on peut importer un cfa", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;contact@lycee.fr`);
    const relationsCsv = createStream(`uai_etablissement_accueil;siret_gestionnaire\n0751234J;11111111100006`);

    const stats = await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const found = await Cfa.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found, {
      type: "Cfa",
      username: "11111111100006",
      siret: "11111111100006",
      email: "contact@lycee.fr",
      academie: { nom: "Toulouse", code: "16" },
      raison_sociale: "Lycée professionnel",
      emails: [],
      etablissements: [{ uai: "0751234J" }],
      voeux_telechargements: [],
      isAdmin: false,
      statut: "en attente",
      unsubscribe: false,
    });
    assert.deepStrictEqual(stats, { total: 1, created: 1, updated: 0, invalid: 0, failed: 0 });
  });

  it("Vérifie si le cfa a des voeux", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;contact@lycee.fr`);
    const relationsCsv = createStream(`uai_etablissement_accueil;siret_gestionnaire\n0751234J;11111111100006`);
    const date = new Date();
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

  it("Vérifie qu'on peut ignorer les cfas invalides (pas d'emails)", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;`);
    const relationsCsv = createStream(`uai_etablissement_accueil;siret_gestionnaire\n0751234J;11111111100006`);

    const stats = await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const count = await Cfa.countDocuments({ siret: "11111111100006" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 1, failed: 0 });
  });

  it("Vérifie qu'on peut mettre à jour uniquement certaines des informations", async () => {
    await importCfas(createStream(`siret;email\n11111111100006;contact@lycee.fr`), {
      relationsCsv: createStream(`uai_etablissement_accueil;siret_gestionnaire\n0751234J;11111111100006`),
      referentielApi: fakeReferentielApi,
    });

    const stats = await importCfas(createStream(`siret;email\n11111111100006;contact@lycee.fr`), {
      referentielApi: new FakeReferentielApi([
        {
          siret: "11111111100006",
          raison_sociale: "Lycée professionnel 2",
          adresse: {
            academie: {
              code: "01",
              nom: "Paris",
            },
          },
        },
      ]),
      relationsCsv: createStream(`uai_etablissement_accueil;siret_gestionnaire
0751234J;11111111100006
0757890U;11111111100006
`),
    });

    const found = await Cfa.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.raison_sociale, "Lycée professionnel 2");
    assert.strictEqual(found.academie.nom, "Paris");
    assert.deepStrictEqual(
      found.etablissements.map((e) => e.uai),
      ["0751234J", "0757890U"]
    );
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 1, invalid: 0, failed: 0 });
  });

  it("Vérifie qu'on gère les relations dupliquées", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;contact@lycee.fr`);
    const relationsCsv = createStream(`uai_etablissement_accueil;siret_gestionnaire
0751234J;11111111100006
0751234J;11111111100006
`);

    await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const found = await Cfa.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.etablissements, [{ uai: "0751234J" }]);
  });

  it("Vérifie qu'on gère les erreurs durant l'import", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;contact@lycee.fr`);
    const options = {
      referentielApi: {
        getOrganisme() {
          throw new Error("Erreur durant l'import");
        },
      },
      relationsCsv: createStream(`uai_etablissement_accueil;siret_gestionnaire\n0751234J;11111111100006`),
    };

    const stats = await importCfas(cfaCsv, options);

    const count = await Cfa.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 0, failed: 1 });
  });

  it("Vérifie qu'on rejete un CFA sans établissements", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;contact@lycee.fr`);
    const relationsCsv = createStream(`uai_etablissement_accueil;siret_gestionnaire`);

    const stats = await importCfas(cfaCsv, {
      relationsCsv,
      referentielApi: fakeReferentielApi,
    });

    const count = await Cfa.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 0, failed: 1 });
  });
});
