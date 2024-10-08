const assert = require("assert");
const importResponsables = require("../../src/jobs/importResponsables");
const { Responsable } = require("../../src/common/model");
const { insertVoeu } = require("../utils/fakeData");
const FakeReferentielApi = require("../utils/FakeReferentielApi");
const { createStream } = require("../utils/testUtils");
const { DateTime } = require("luxon");

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

describe("importResponsables", () => {
  xit("Vérifie qu'on peut importer un cfa", async () => {
    const cfaCsv = createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;0751234J`);

    const stats = await importResponsables(cfaCsv, {
      referentielApi: fakeReferentielApi,
    });

    const found = await Responsable.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found, {
      type: "Responsable",
      username: "11111111100006",
      siret: "11111111100006",
      email: "contact@lycee.fr",
      anciens_emails: [],
      academie: { nom: "Toulouse", code: "16" },
      raison_sociale: "Lycée professionnel",
      emails: [],
      etablissements: [{ uai: "0751234J" }],
      voeux_telechargements: [],
      isAdmin: false,
      statut: "en attente",
      unsubscribe: false,
      _meta: {},
    });
    assert.deepStrictEqual(stats, { total: 1, created: 1, updated: 0, invalid: 0, failed: 0 });
  });

  xit("Vérifie que le cfa a des voeux", async () => {
    const cfaCsv = createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;0751234J,0757890U`);
    const today = new Date();
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
      },
      _meta: {
        import_dates: [today],
      },
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "0757890U",
      },
      _meta: {
        import_dates: [yesterday],
      },
    });

    await importResponsables(cfaCsv, {
      referentielApi: fakeReferentielApi,
    });

    const found = await Responsable.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.etablissements[0].voeux_date, today);
    assert.deepStrictEqual(found.etablissements[1].voeux_date, yesterday);
  });

  xit("Vérifie qu'on peut ignorer les cfas invalides (pas d'emails)", async () => {
    const cfaCsv = createStream(`siret;email\n11111111100006;`);
    const relations = createStream(`uai;siret_uai_responsable\n0751234J;11111111100006`);

    const stats = await importResponsables(cfaCsv, {
      relations,
      referentielApi: fakeReferentielApi,
    });

    const count = await Responsable.countDocuments({ siret: "11111111100006" });
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 1, failed: 0 });
  });

  xit("Vérifie qu'on peut mettre à jour uniquement certaines des informations", async () => {
    const today = new Date();

    await importResponsables(createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;0751234J`), {
      referentielApi: fakeReferentielApi,
    });

    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
      },
      _meta: {
        import_dates: [today],
      },
    });

    const stats = await importResponsables(
      createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;0751234J,0757890U`),
      {
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
      }
    );

    const found = await Responsable.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.raison_sociale, "Lycée professionnel 2");
    assert.strictEqual(found.academie.nom, "Paris");
    assert.deepStrictEqual(found.etablissements, [
      {
        uai: "0751234J",
        voeux_date: today,
      },
      {
        uai: "0757890U",
      },
    ]);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 1, invalid: 0, failed: 0 });
  });

  xit("Vérifie qu'on gère les relations dupliquées", async () => {
    const cfaCsv = createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;0751234J,0751234J`);

    await importResponsables(cfaCsv, {
      referentielApi: fakeReferentielApi,
    });

    const found = await Responsable.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(found.etablissements, [{ uai: "0751234J" }]);
  });

  xit("Vérifie qu'on gère les erreurs durant l'import", async () => {
    const cfaCsv = createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;0751234J`);
    const options = {
      referentielApi: {
        getOrganisme() {
          throw new Error("Erreur durant l'import");
        },
      },
    };

    const stats = await importResponsables(cfaCsv, options);

    const count = await Responsable.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 0, failed: 1 });
  });

  xit("Vérifie qu'on gère les organismes inconnus dans le référentiel", async () => {
    const cfaCsv = createStream(`siret;email;etablissements\n99999999999999;contact@lycee.fr;0751234J`);
    const options = {
      referentielApi: {
        getOrganisme() {
          return Promise.reject(new Error("Erreur durant l'import"));
        },
      },
    };

    const stats = await importResponsables(cfaCsv, options);

    const found = await Responsable.findOne();
    assert.strictEqual(found.siret, "99999999999999");
    assert.strictEqual(found.raison_sociale, "Inconnue");
    assert.deepStrictEqual(stats, { total: 1, created: 1, updated: 0, invalid: 0, failed: 0 });
  });

  xit("Vérifie qu'on rejete un CFA sans établissements", async () => {
    const cfaCsv = createStream(`siret;email;etablissements\n11111111100006;contact@lycee.fr;`);

    const stats = await importResponsables(cfaCsv, {
      referentielApi: fakeReferentielApi,
    });

    const count = await Responsable.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, { total: 1, created: 0, updated: 0, invalid: 1, failed: 0 });
  });
});
