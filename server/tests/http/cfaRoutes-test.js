const assert = require("assert");
const { DateTime } = require("luxon");
const { Cfa } = require("../../src/common/model");
const { insertVoeu } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");

describe("cfaRoutes", () => {
  it("Vérifie qu'un cfa peut accéder à la liste des fichiers en étant authentifié", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Cfa,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
    });

    const response = await httpClient.get("/api/cfa/fichiers", {
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

  it("Vérifie qu'on peut accéder à un fichier", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("0751234J", "password", {
      model: Cfa,
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

    const response = await httpClient.get("/api/cfa/fichiers/0751234J.csv", {
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

  it("Vérifie qu'un événement est enregistré quand un cfa télécharge un fichier", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Cfa,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
    });
    await insertVoeu({
      etablissement_accueil: { uai: "0751234J" },
    });

    const response = await httpClient.get("/api/cfa/fichiers/0751234J.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);

    const found = await Cfa.findOne({ username: "11111111100006" }).lean();
    assert.ok(found.voeux_telechargements[0].date);
  });

  it("Vérifie qu'on indique au cfa quand il y a une nouvelle version du fichier disponible", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Cfa,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: DateTime.fromISO("2021-06-02T14:00:00.000Z").minus({ days: 10 }).toJSDate(),
        },
      ],
    });

    const response = await httpClient.get("/api/cfa/fichiers", {
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

  it("Vérifie qu'on indique au cfa si le fichier a déjà été téléchargé", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", {
      model: Cfa,
      etablissements: [{ uai: "0751234J", voeux_date: DateTime.fromISO("2021-06-02T14:00:00.000Z").toJSDate() }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: DateTime.fromISO("2021-06-03T14:00:00.000Z").toJSDate(),
        },
      ],
    });

    const response = await httpClient.get("/api/cfa/fichiers", {
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

  it("Doit rejeter un utilisateur qui n'est pas un cfa", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("user1", "password");

    const response = await httpClient.get("/api/cfa/fichiers/unknown.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 403);
  });

  it("Doit rejeter un fichier UAI qui n'appartient pas au CFA", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", { model: Cfa });

    const response = await httpClient.get("/api/cfa/fichiers/0757890U.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 404);
  });

  it("Doit rejeter un nom de fichier invalide", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("11111111100006", "password", { model: Cfa });

    const response = await httpClient.get("/api/cfa/fichiers/invalide.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 400);
  });

  it("Doit rejeter une requete sans authentification", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/cfa/fichiers");

    assert.strictEqual(response.status, 401);
  });
});
