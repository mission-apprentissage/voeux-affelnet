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
      academies: [{ code: "01", nom: "Paris" }],
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
        academies: [{ code: "01", nom: "Paris" }],
      },
      {
        name: "voeux-affelnet-croisement.xls",
        date: date.toISOString(),
        academies: [{ code: "01", nom: "Paris" }],
      },
      {
        name: "voeux-affelnet-synthese.csv",
        date: date.toISOString(),
        academies: [{ code: "01", nom: "Paris" }],
      },
      {
        name: "voeux-affelnet-synthese.xls",
        date: date.toISOString(),
        academies: [{ code: "01", nom: "Paris" }],
      },
    ]);
  });

  it("Vérifie qu'un csaio obtient une liste de fichiers vide quand il n'y a pas de voeux", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      academies: [{ code: "01", nom: "Paris" }],
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
      academies: [{ code: "18", nom: "Orléans-Tours" }],
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
            libelle: "36 rue des lilas 45000 Orléans FRANCE",
            ligne_1: "36 rue des lilas",
            code_postal: "45000",
            ville: "Orléans",
            pays: "FRANCE",
          },
        },
        responsable: {
          telephone_1: "0112345678",
          email_1: "test1@apprentissage.beta.gouv.fr",
        },
        etablissement_origine: {
          uai: "0751234X",
          nom: "Etablissement Origine",
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
        academie: { code: "18", nom: "Orléans-Tours" },
        _meta: {
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
            libelle: "36 rue des lilas 45000 Orléans FRANCE",
            ligne_1: "36 rue des lilas",
            code_postal: "45000",
            ville: "Orléans",
            pays: "FRANCE",
          },
        },
        responsable: {
          telephone_1: "0112345678",
          email_1: "test1@apprentissage.beta.gouv.fr",
        },
        etablissement_origine: {
          uai: "0751234X",
          nom: "Etablissement Origine",
          cio: "0751234A",
        },
        etablissement_accueil: {
          uai: "0751234Z",
          nom: "Etablissement Accueil",
          cio: "0751234Y",
        },
        formation: {
          mef: "2472521431",
          code_formation_diplome: "50025214",
          libelle: "2CAP2  CUISINE",
          cle_ministere_educatif: "607555K72235467880206761827130152735855-78100#L60",
        },
        academie: { code: "18", nom: "Orléans-Tours" },
        _meta: {
          jeune_uniquement_en_apprentissage: false,
        },
      }),
      insertVoeu({
        apprenant: {
          ine: "MNOPQR",
          nom: "Dupont",
          prenom: "Jacques",
          telephone_personnel: "0212345678",
          telephone_portable: "0712345678",
          adresse: {
            libelle: "36 rue des lilas 45000 Orléans FRANCE",
            ligne_1: "36 rue des lilas",
            code_postal: "45000",
            ville: "Orléans",
            pays: "FRANCE",
          },
        },
        responsable: {
          telephone_1: "0112345678",
          email_1: "test1@apprentissage.beta.gouv.fr",
        },
        etablissement_origine: {
          uai: "0751234X",
          nom: "Etablissement Origine",
          cio: "0751234A",
        },
        etablissement_accueil: {
          uai: "0751234Z",
          nom: "Etablissement Accueil",
          cio: "0751234Y",
        },
        formation: {
          mef: "2472521431",
          code_formation_diplome: "50025214",
          libelle: "2CAP2  CUISINE",
          cle_ministere_educatif: "607555K72235467880206761827130152735855-78100#L60",
        },
        academie: { code: "18", nom: "Orléans-Tours" },
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
      `Apprenant INE;Apprenant Nom;Apprenant prénom;Apprenant Téléphone Personnel;Apprenant Téléphone Portable;Apprenant Adresse;Apprenant Adresse Code Postal;Apprenant Adresse Ville;Apprenant Adresse Pays;Etablissement Origine UAI;Etablissement Origine Nom;Etablissement Origine CIO;Etablissement Accueil UAI;Etablissement Accueil Nom;Etablissement Accueil CIO;Formation CFD;Formation MEF;Formation Libellé;Académie;Statut dans le tableau de bord;Date de téléchargement du voeu par l'OF;La Bonne Alternance;InserJeunes;Didask - Prendre contact avec un CFA;Didask - Chercher un employeur;Didask - Préparer un entretien avec un employeur;Didask - S'intégrer dans l'entreprise;Jeunes uniquement en apprentissage
ABCDEF;Dupont;Robert;0112345678;0612345678;36 rue des lilas 45000 Orléans FRANCE;45000;Orléans;FRANCE;0751234X;Etablissement Origine;0751234A;0751234J;Etablissement Accueil;0751234Y;40025214;2472521431;1CAP2  CUISINE;Orléans-Tours;Apprenti;2022-07-23;;;;;;;Oui
GHIJKL;Dupont;Henri;0212345678;0712345678;36 rue des lilas 45000 Orléans FRANCE;45000;Orléans;FRANCE;0751234X;Etablissement Origine;0751234A;0751234Z;Etablissement Accueil;0751234Y;50025214;2472521431;2CAP2  CUISINE;Orléans-Tours;Non trouvé;;https://labonnealternance.pole-emploi.fr/recherche-apprentissage?&display=list&page=fiche&type=training&itemId=607555K72235467880206761827130152735855-78100%23L60;https://trajectoires-pro.apprentissage.beta.gouv.fr/api/inserjeunes/formations/0751234Z-50025214.svg;https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987;https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e;https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac;https://dinum-beta.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91;Non
MNOPQR;Dupont;Jacques;0212345678;0712345678;36 rue des lilas 45000 Orléans FRANCE;45000;Orléans;FRANCE;0751234X;Etablissement Origine;0751234A;0751234Z;Etablissement Accueil;0751234Y;50025214;2472521431;2CAP2  CUISINE;Orléans-Tours;Non trouvé;;https://labonnealternance.pole-emploi.fr/recherche-apprentissage?&display=list&page=fiche&type=training&itemId=607555K72235467880206761827130152735855-78100%23L60;https://trajectoires-pro.apprentissage.beta.gouv.fr/api/inserjeunes/formations/0751234Z-50025214.svg;https://dinum-beta.didask.com/courses/demonstration/60abc18c075edf000065c987;https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e;https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac;https://dinum-beta.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91;Non
`
    );
  });

  it("Vérifie qu'un csaio peut télécharger le fichier de synthese par région", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("csaio", "password", {
      model: Csaio,
      academies: [{ code: "01", nom: "Paris" }],
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
            libelle: "36 rue des lilas 75019 Paris FRANCE",
            ligne_1: "36 rue des lilas",
            code_postal: "75019",
            ville: "Paris",
            pays: "FRANCE",
          },
        },
        academie: { code: "01", nom: "Paris" },
        etablissement_accueil: {
          uai: "0751234Z",
        },
        formation: {
          code_formation_diplome: "50025214",
        },
        _meta: {
          jeune_uniquement_en_apprentissage: true,
        },
      }),
      insertVoeu({
        apprenant: {
          ine: "GHIJKL",
          nom: "Dupont",
          prenom: "Jacques",
          telephone_personnel: "0112345678",
          telephone_portable: "0612345678",
          adresse: {
            libelle: "36 rue des lilas 75019 Paris FRANCE",
            ligne_1: "36 rue des lilas",
            code_postal: "75019",
            ville: "Paris",
            pays: "FRANCE",
          },
        },
        academie: { code: "01", nom: "Paris" },
        etablissement_accueil: {
          uai: "0751234Z",
        },
        formation: {
          code_formation_diplome: "50025214",
        },
        _meta: {
          jeune_uniquement_en_apprentissage: false,
        },
      }),
      insertVoeu({
        apprenant: {
          ine: "MNOPQR",
          nom: "Dupont",
          prenom: "Pierre",
          telephone_personnel: "0112345678",
          telephone_portable: "0612345678",
          adresse: {
            libelle: "36 rue des lilas 75019 Paris FRANCE",
            ligne_1: "36 rue des lilas",
            code_postal: "75019",
            ville: "Paris",
            pays: "FRANCE",
          },
        },
        academie: { code: "01", nom: "Paris" },
        etablissement_accueil: {
          uai: "0751234Z",
        },
        formation: {
          code_formation_diplome: "50025214",
        },
      }),
      insertDossier({
        ine_apprenant: "ABCDEF",
        statut: "abandon",
        uai_etablissement: "0751234Z",
        formation_cfd: "50025214",
        _meta: {
          import_dates: [date.toJSDate()],
        },
      }),
      insertDossier({
        ine_apprenant: "ABCDEF",
        statut: "apprenti",
        uai_etablissement: "0751234Z",
        formation_cfd: "50025214",
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
GHIJKL;Dupont;Jacques;0112345678;0612345678;36 rue des lilas 75019 Paris FRANCE;75019;Paris;FRANCE;Non trouvé;Non
MNOPQR;Dupont;Pierre;0112345678;0612345678;36 rue des lilas 75019 Paris FRANCE;75019;Paris;FRANCE;Non trouvé;ND
ABCDEF;Dupont;Robert;0112345678;0612345678;36 rue des lilas 75019 Paris FRANCE;75019;Paris;FRANCE;Apprenti;Oui
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
      academies: [{ code: "01", nom: "Paris" }],
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
