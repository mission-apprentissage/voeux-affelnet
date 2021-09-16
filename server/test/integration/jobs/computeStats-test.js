const assert = require("assert");
const { DateTime } = require("luxon");
const integrationTests = require("../utils/integrationTests");
const { insertCfa, insertVoeu } = require("../utils/fakeData");
const computeStats = require("../../../src/jobs/computeStats");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut calculer les stats", async () => {
    let firstImport = DateTime.fromISO("2021-06-02T14:00:00.000Z");
    let secondImport = DateTime.fromISO("2021-06-15T14:00:00.000Z");

    await insertCfa({
      username: "0751234J",
      statut: "activé",
      voeux_date: new Date(),
      email: "test@apprentissage.beta.gouv.fr",
      voeux_telechargements: [{ date: firstImport.plus({ days: 1 }) }, { date: secondImport.plus({ days: 1 }) }],
    });
    await insertCfa({
      statut: "confirmé",
      voeux_date: new Date(),
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "confirmation_contact",
          to: "test1@apprentissage.beta.gouv.fr",
          sendDates: [DateTime.now().minus({ days: 10 }).toJSDate(), new Date()],
          openDate: new Date(),
        },
      ],
    });
    await insertCfa({
      statut: "en attente",
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "confirmation_contact",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [DateTime.now().minus({ days: 10 }).toJSDate(), new Date()],
          error: {
            type: "fatal",
            message: "email error",
          },
        },
      ],
    });
    await insertCfa({
      statut: "en attente",
      email: "test@apprentissage.beta.gouv.fr",
      voeux_date: new Date(),
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN1",
          templateName: "confirmation_contact",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [DateTime.now().minus({ days: 10 }).toJSDate()],
          openDate: new Date(),
        },
      ],
    });
    await insertVoeu({
      "etablissement_accueil.uai": "INCONNNU",
      _meta: {
        import_dates: [firstImport.toJSDate(), secondImport.toJSDate()],
      },
    });
    await insertVoeu({
      apprenant: { ine: "ABCDEF" },
      "etablissement_accueil.uai": "0751234J",
      _meta: {
        import_dates: [firstImport.toJSDate(), secondImport.toJSDate()],
      },
    });

    let stats = await computeStats();

    assert.deepStrictEqual(
      stats.cfas.find((c) => c.code === "ALL"),
      {
        code: "ALL",
        stats: {
          total: 4,
          enAttente: 2,
          enAttenteAvecVoeux: 1,
          confirmés: 1,
          confirmésAvecVoeux: 1,
          désinscrits: 1,
          désinscritsAvecVoeux: 1,
          injoinables: 1,
          injoinablesAvecVoeux: 0,
          activés: 1,
        },
      }
    );
    assert.deepStrictEqual(
      stats.cfas.find((c) => c.code === "01"),
      {
        code: "01",
        stats: {
          total: 0,
          enAttente: 0,
          enAttenteAvecVoeux: 0,
          confirmés: 0,
          confirmésAvecVoeux: 0,
          désinscrits: 0,
          désinscritsAvecVoeux: 0,
          injoinables: 0,
          injoinablesAvecVoeux: 0,
          activés: 0,
        },
      }
    );
    assert.deepStrictEqual(
      stats.cfas.find((c) => c.code === "11"),
      {
        code: "11",
        stats: {
          total: 4,
          enAttente: 2,
          enAttenteAvecVoeux: 1,
          confirmés: 1,
          confirmésAvecVoeux: 1,
          désinscrits: 1,
          désinscritsAvecVoeux: 1,
          injoinables: 1,
          injoinablesAvecVoeux: 0,
          activés: 1,
        },
      }
    );

    assert.deepStrictEqual(
      stats.voeux.find((c) => c.code === "ALL"),
      {
        code: "ALL",
        stats: {
          total: 2,
          apprenants: 2,
          cfasInconnus: 1,
          nbVoeuxDiffusés: 1,
        },
      }
    );
    assert.deepStrictEqual(
      stats.voeux.find((c) => c.code === "01"),
      {
        code: "01",
        stats: {
          total: 0,
          apprenants: 0,
          cfasInconnus: 0,
          nbVoeuxDiffusés: 0,
        },
      }
    );
    assert.deepStrictEqual(
      stats.voeux.find((c) => c.code === "11"),
      {
        code: "11",
        stats: {
          total: 2,
          apprenants: 2,
          cfasInconnus: 1,
          nbVoeuxDiffusés: 1,
        },
      }
    );

    assert.deepStrictEqual(
      stats.emails.find((c) => c.code === "ALL"),
      {
        code: "ALL",
        stats: [{ _id: "confirmation", nbEnvoyés: 3, nbErreurs: 1, nbOuverts: 2, nbRelances: 2 }],
      }
    );
    assert.deepStrictEqual(
      stats.emails.find((c) => c.code === "01"),
      {
        code: "01",
        stats: [],
      }
    );
    assert.deepStrictEqual(
      stats.emails.find((c) => c.code === "11"),
      {
        code: "11",
        stats: [{ _id: "confirmation", nbEnvoyés: 3, nbErreurs: 1, nbOuverts: 2, nbRelances: 2 }],
      }
    );

    assert.deepStrictEqual(
      stats["téléchargements"].find((c) => c.code === "ALL"),
      {
        code: "ALL",
        stats: [
          {
            import_date: secondImport.toJSDate(),
            total: 1,
          },
          {
            import_date: firstImport.toJSDate(),
            total: 1,
          },
        ],
      }
    );
    assert.deepStrictEqual(
      stats["téléchargements"].find((c) => c.code === "01"),
      {
        code: "01",
        stats: [
          {
            import_date: secondImport.toJSDate(),
            total: 0,
          },
          {
            import_date: firstImport.toJSDate(),
            total: 0,
          },
        ],
      }
    );
    assert.deepStrictEqual(
      stats["téléchargements"].find((c) => c.code === "11"),
      {
        code: "11",
        stats: [
          {
            import_date: secondImport.toJSDate(),
            total: 1,
          },
          {
            import_date: firstImport.toJSDate(),
            total: 1,
          },
        ],
      }
    );
  });

  it("Vérifie qu'on peut calculer les stats pour une seule académie", async () => {
    let stats = await computeStats({ academies: ["01"] });

    assert.strictEqual(stats.cfas.length, 1);
    assert.strictEqual(stats.voeux.length, 1);
    assert.strictEqual(stats.emails.length, 1);
    assert.strictEqual(stats["téléchargements"].length, 1);
  });
});
