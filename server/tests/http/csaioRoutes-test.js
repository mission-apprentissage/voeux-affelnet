const assert = require("assert");
const { insertVoeu } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");
const { Csaio } = require("../../src/common/model/index.js");
const { insertDossier, insertCfa } = require("../utils/fakeData.js");
const { DateTime } = require("luxon");

describe("csaioRoutes", () => {
  it("Vérifie qu'un csaio peut accéder à la liste des fichiers en étant authentifié", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });
    const date = new Date();
    await insertDossier({
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
        name: "voeux-affelnet-croisement.csv",
        date: date.toISOString(),
      },
      {
        name: "voeux-affelnet-croisement.xls",
        date: date.toISOString(),
      },
      {
        name: "voeux-affelnet-synthese.csv",
        date: date.toISOString(),
      },
      {
        name: "voeux-affelnet-synthese.xls",
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

  it("Vérifie qu'un csaio peut télécharger le fichier de croisement par région avec les statuts du tdb", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });

    const date = DateTime.fromISO("2022-07-23T14:00:00.000Z");

    await Promise.all([
      insertCfa({
        voeux_telechargements: [
          {
            uai: "0751234J",
            date: date.toJSDate(),
          },
        ],
      }),
      insertVoeu({
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
        etablissement_origine: {
          cio: "0751234A",
        },
        etablissement_accueil: {
          uai: "0751234J",
          nom: "Etablissement Accueil",
          cio: "0751234Y",
        },
        formation: {
          mef: "2472521431",
          code_formation_diplome: "40025214",
          libelle: "1CAP2  CUISINE",
          cle_ministere_educatif: "CLE",
        },
        academie: { code: "01", nom: "Paris" },
        _meta: {
          adresse: "36 rue des lilas 75019 Paris FRANCE",
          jeune_uniquement_en_apprentissage: true,
        },
      }),
      insertVoeu({
        apprenant: {
          ine: "GHIJKL",
          nom: "Dupont",
          prenom: "Henri",
          telephone_personnel: "0212345678",
          telephone_portable: "0712345678",
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
        etablissement_accueil: { uai: "0751234X", nom: "Etablissement Accueil", cio: "0751234Y" },
        formation: {
          mef: "2472521431",
          code_formation_diplome: "50025214",
          libelle: "2CAP2  CUISINE",
          cle_ministere_educatif: "607555K72235467880206761827130152735855-78100#L60",
        },
        academie: { code: "01", nom: "Paris" },
        _meta: {
          adresse: "36 rue des lilas 75019 Paris FRANCE",
        },
      }),
      insertVoeu({
        academie: { code: "11", nom: "Montpellier" },
      }),
      insertDossier({
        ine_apprenant: "ABCDEF",
        formation_cfd: "40025214",
        uai_etablissement: "0751234J",
        statut: "apprenti",
        _meta: {
          import_dates: [date.toJSDate()],
        },
      }),
    ]);

    const response = await httpClient.get("/api/csaio/fichiers/voeux-affelnet-croisement.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.headers["content-disposition"],
      `attachment; filename=voeux-affelnet-croisement-${date.toISODate()}.csv`
    );
    assert.strictEqual(
      response.data,
      `Apprenant INE;Apprenant Nom;Apprenant prénom;Apprenant Téléphone Personnel;Apprenant Téléphone Portable;Apprenant Adresse;Apprenant Adresse Code Postal;Apprenant Adresse Ville;Apprenant Adresse Pays;Etablissement Origine CIO;Etablissement Accueil UAI;Etablissement Accueil Nom;Etablissement Accueil CIO;Formation CFD;Formation MEF;Formation Libellé;Académie;Statut dans le tableau de bord;Date de téléchargement du voeu par l'OF;La Bonne Alternance;InserJeunes;Didask - Prendre contact avec un CFA;Didask - Chercher un employeur;Didask - Préparer un entretien avec un employeur;Didask - S'intégrer dans l'entreprise;Jeunes uniquement en apprentissage
ABCDEF;Dupont;Robert;0112345678;0612345678;36 rue des lilas 75019 Paris FRANCE;75019;Paris;FRANCE;0751234A;0751234J;Etablissement Accueil;0751234Y;40025214;2472521431;1CAP2  CUISINE;Paris;Apprenti;2022-07-23;;;;;;;Oui
GHIJKL;Dupont;Henri;0212345678;0712345678;36 rue des lilas 75019 Paris FRANCE;75019;Paris;FRANCE;;0751234X;Etablissement Accueil;0751234Y;50025214;2472521431;2CAP2  CUISINE;Paris;Non trouvé;;https://labonnealternance.pole-emploi.fr/recherche-apprentissage?&display=list&page=fiche&type=training&itemId=607555K72235467880206761827130152735855-78100%23L60;https://trajectoires-pro.apprentissage.beta.gouv.fr/api/inserjeunes/formations/0751234X-50025214.svg;https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987;https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e;https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac;https://dinum-beta.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91;Non
`
    );
  });

  it("Vérifie qu'un csaio peut télécharger le fichier de synthese par région avec les statuts du tdb", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      region: { code: "11", nom: "Île-de-France" },
    });

    const date = DateTime.fromISO("2022-07-23T14:00:00.000Z");

    await Promise.all([
      insertVoeu({
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
        academie: { code: "01", nom: "Paris" },
        _meta: {
          adresse: "36 rue des lilas 75019 Paris FRANCE",
        },
      }),
      insertDossier({
        ine_apprenant: "ABCDEF",
        statut: "abandon",
        _meta: {
          import_dates: [date.toJSDate()],
        },
      }),
      insertDossier({
        ine_apprenant: "ABCDEF",
        statut: "apprenti",
        _meta: {
          import_dates: [date.toJSDate()],
        },
      }),
    ]);

    const response = await httpClient.get("/api/csaio/fichiers/voeux-affelnet-synthese.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.headers["content-disposition"],
      `attachment; filename=voeux-affelnet-synthese-${date.toISODate()}.csv`
    );
    assert.strictEqual(
      response.data,
      `Apprenant INE;Apprenant Nom;Apprenant prénom;Apprenant Téléphone Personnel;Apprenant Téléphone Portable;Apprenant Adresse;Apprenant Adresse Code Postal;Apprenant Adresse Ville;Apprenant Adresse Pays;Statut dans le tableau de bord;Jeunes uniquement en apprentissage
ABCDEF;Dupont;Robert;0112345678;0612345678;36 rue des lilas 75019 Paris FRANCE;75019;Paris;FRANCE;Apprenti;Non
`
    );
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
