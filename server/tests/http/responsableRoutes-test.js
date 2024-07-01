const assert = require("assert");
const { DateTime } = require("luxon");
const { Responsable } = require("../../src/common/model");
const { insertVoeu } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");

describe("responsableRoutes", () => {
  xit("Vérifie qu'un responsable peut accéder à la liste des fichiers en étant authentifié", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Responsable,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
    });

    const response = await httpClient.get("/api/responsable/fichiers", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, [
      {
        name: "0751234J.csv",
        date: "2021-06-02T14:00:00.000Z",
        etablissement: null,
        lastDownloadDate: null,
      },
    ]);
  });

  xit("Vérifie qu'on peut accéder à un fichier", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("0751234J", "password", {
      model: Responsable,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
    });
    await insertVoeu({
      apprenant: {
        ine: "ABCDEF",
        nom: "Dupont",
        prenom: "Robert",
        telephone_personnel: "0112345678",
        telephone_portable: "0612345678",
        adresse: {
          ligne_1: "36 rue des lilas",
          code_postal: "75019",
          ville: "Paris",
          pays: "FRANCE",
        },
      },
      responsable: {
        telephone_1: "0112345678",
        email_1: "test1@apprentissage.beta.gouv.fr",
      },
      etablissement_origine: { uai: "0757890U", nom: "LYCEE SAS" },
      etablissement_accueil: { uai: "0751234J" },
      formation: {
        mef: "2472521431",
        code_formation_diplome: "40025214",
      },
      _meta: {
        adresse: "36 rue des lilas 75019 Paris FRANCE",
      },
    });

    const response = await httpClient.get("/api/responsable/fichiers/0751234J.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"INE_APPRENANT";"NOM_APPRENANT";"PRENOM_APPRENANT";"ADRESSE1_APPR";"ADRESSE2_APPR";"ADRESSE3_APPR";"ADRESSE4_APPR";"CP_APPR";"VILLE_APPR";"ID_PAYS";"TEL1_APPR";"TEL2_APPR";"NOM_REP_LEGAL";"TEL1_REP_LEGAL";"TEL2_REP_LEGAL";"EMAIL1_REP_LEGAL";"EMAIL2_REP_LEGAL";"ID_FORMATION_SOUHAIT1";"LIBELLE_FORMATION_SOUHAIT1";"CODE_MEF_10_FORMATION_SOUHAIT1";"ID_ETABLISSEMENT_ORIGINE";"NOM_ETAB_ORIGINE"
"ABCDEF";"Dupont";"Robert";"36 rue des lilas";"";"";"";"75019";"Paris";"FRANCE";"0112345678";"0612345678";"Dupont";"0112345678";"";"test1@apprentissage.beta.gouv.fr";"";"40025214";"1CAP2  CUISINE";"2472521431";"0757890U";"LYCEE SAS"
`
    );
  });

  xit("Vérifie qu'un événement est enregistré quand un responsable télécharge un fichier", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Responsable,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
    });
    await insertVoeu({
      etablissement_accueil: { uai: "0751234J" },
    });

    const response = await httpClient.get("/api/responsable/fichiers/0751234J.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);

    const found = await Responsable.findOne({ username: "11111111100006" }).lean();
    assert.ok(found.voeux_telechargements[0].date);
  });

  xit("Vérifie qu'on indique au responsable quand il y a une nouvelle version du fichier disponible", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Responsable,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: DateTime.fromISO("2021-06-02T14:00:00.000Z").minus({ days: 10 }).toJSDate(),
        },
      ],
    });

    const response = await httpClient.get("/api/responsable/fichiers", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, [
      {
        name: "0751234J.csv",
        date: "2021-06-02T14:00:00.000Z",
        etablissement: null,
        lastDownloadDate: null,
      },
    ]);
  });

  xit("Vérifie qu'on indique au responsable si le fichier a déjà été téléchargé", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Responsable,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: DateTime.fromISO("2021-06-03T14:00:00.000Z").toJSDate(),
        },
      ],
    });

    const response = await httpClient.get("/api/responsable/fichiers", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, [
      {
        name: "0751234J.csv",
        date: "2021-06-02T14:00:00.000Z",
        etablissement: null,
        lastDownloadDate: "2021-06-03T14:00:00.000Z",
      },
    ]);
  });

  xit("Doit rejeter un utilisateur qui n'est pas un responsable", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("user1", "password");

    const response = await httpClient.get("/api/responsable/fichiers/unknown.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 403);
  });

  xit("Doit rejeter un fichier UAI qui n'appartient pas au responsable", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", { model: Responsable });

    const response = await httpClient.get("/api/responsable/fichiers/0757890U.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 404);
  });

  xit("Doit rejeter un nom de fichier invalide", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", { model: Responsable });

    const response = await httpClient.get("/api/responsable/fichiers/invalide.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 400);
  });

  xit("Doit rejeter une requete sans authentification", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/responsable/fichiers");

    assert.strictEqual(response.status, 401);
  });
});
