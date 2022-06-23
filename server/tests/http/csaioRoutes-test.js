const assert = require("assert");
const { insertVoeu } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");
const { Csaio } = require("../../src/common/model/index.js");
const { insertDossier } = require("../utils/fakeData.js");
const { DateTime } = require("luxon");

describe("csaioRoutes", () => {
  it("Vérifie qu'un csaio peut accéder à la liste des fichiers en étant authentifié", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });
    const date = new Date();
    await insertVoeu({
      academie: { code: "01", nom: "Paris" },
      _meta: {
        import_dates: [date],
      },
    });

    const response = await httpClient.get("/api/csaio/fichiers", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, [
      {
        name: "croisement.csv",
        date: date.toISOString(),
      },
      {
        name: "aggregation.csv",
        date: date.toISOString(),
      },
    ]);
  });

  it("Vérifie qu'un csaio obtient une liste de fichiers vide quand il n'y a pas de voeux", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });

    const response = await httpClient.get("/api/csaio/fichiers", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, []);
  });

  it("Vérifie qu'un csaio peut télécharger le fichier de croisement", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });

    const date = DateTime.fromISO("2022-07-23T14:00:00.000Z").toJSDate();
    await insertVoeu({
      apprenant: { ine: "ABCDEF", telephone_personnel: "0112345678", telephone_portable: "0612345678" },
      etablissement_accueil: { uai: "0751234J", nom: "Etablissement Accueil" },
      formation: { code_formation_diplome: "40025214", libelle: "1CAP2  CUISINE", cle_ministere_educatif: "CLE" },
      academie: { code: "01", nom: "Paris" },
      _meta: {
        import_dates: [date],
      },
    });

    const response = await httpClient.get("/api/csaio/fichiers/croisement.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers["content-disposition"], "attachment; filename=croisement-2022-07-23.csv");
    assert.strictEqual(
      response.data,
      `Apprenant INE;Apprenant Nom;Apprenant prénom;Apprenant Téléphone Personnel;Apprenant Téléphone Portable;Apprenant Adresse;Etablissement Accueil UAI;Etablissement Accueil Nom;Formation CFD;Formation MEF;Formation Libellé;Académie;Statut dans le tableau de bord;La Bonne Alternance;InserJeunes;Didask - Prendre contact avec un CFA;Didask - Chercher un employeur;Didask - Préparer un entretien avec un employeur;Didask - S'intégrer dans l'entreprise
ABCDEF;Dupont;Robert;0112345678;0612345678;36 rue des lilas 75019 Paris FRANCE;0751234J;Etablissement Accueil;40025214;2472521431;1CAP2  CUISINE;Paris;Non trouvé;https://labonnealternance.pole-emploi.fr/recherche-apprentissage?&display=list&page=fiche&type=training&itemId=CLE;https://trajectoires-pro.apprentissage.beta.gouv.fr/api/inserjeunes/formations/0751234J-40025214.svg;https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987;https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e;https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac;https://dinum-beta.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91
`
    );
  });

  it("Vérifie qu'on recherche le statut dans les dossiers du tableau de bord", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });

    const date = new Date();
    await insertVoeu({
      apprenant: { ine: "ABCDEF", telephone_personnel: "0112345678", telephone_portable: "0612345678" },
      etablissement_accueil: { uai: "0751234J", nom: "Etablissement Accueil" },
      formation: { code_formation_diplome: "40025214", libelle: "1CAP2  CUISINE" },
      academie: { code: "01", nom: "Paris" },
      _meta: {
        import_dates: [date],
      },
    });
    await insertDossier({
      ine_apprenant: "ABCDEF",
      formation_cfd: "40025214",
      uai_etablissement: "0751234J",
    });

    const response = await httpClient.get("/api/csaio/fichiers/croisement.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    const line = response.data.split("\n")[1];
    assert.strictEqual(line.split(";")[12], `apprenti`);
  });

  it("Doit rejeter un utilisateur qui n'est pas un csaio", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("user1", "password");

    const response = await httpClient.get("/api/csaio/fichiers/unknown.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 403);
  });

  it("Doit rejeter un nom de fichier invalide", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });

    const response = await httpClient.get("/api/csaio/fichiers/invalide.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 400);
  });

  it("Doit rejeter une requete sans authentification", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/csaio/fichiers");

    assert.strictEqual(response.status, 401);
  });
});