const assert = require("assert");
const { Cfa } = require("../../../src/common/model");
const httpTests = require("../utils/httpTests");
const { insertCfa, insertVoeu, insertLog } = require("../utils/fakeData");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut obtenir la liste des cfas", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      username: "11111111100006",
      password: "12345",
      email: "contact@organisme.com",
      raison_sociale: "Organisme de formation",
    });

    let response = await httpClient.get("/api/admin/cfas", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      cfas: [
        {
          statut: "en attente",
          isAdmin: false,
          unsubscribe: false,
          type: "Cfa",
          username: "11111111100006",
          siret: "11111111100006",
          raison_sociale: "Organisme de formation",
          academie: { code: "11", nom: "Île-de-France" },
          email: "contact@organisme.com",
          email_source: "inconnue",
          etablissements: [],
          emails: [],
          voeux_telechargements: [],
        },
      ],
      pagination: { page: 1, items_par_page: 10, nombre_de_page: 1, total: 1 },
    });
  });

  it("Vérifie qu'on peut obtenir la liste paginée des cfas ", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({ username: "11111111100006" });
    await insertCfa({ username: "22222222200006" });
    await insertCfa({ username: "33333333300006" });

    let response = await httpClient.get("/api/admin/cfas?page=2&items_par_page=1", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.cfas.length, 1);
    assert.deepStrictEqual(response.data.cfas[0].username, "22222222200006");
  });

  it("Vérifie qu'on peut filtrer les cfas", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      email: "contact@organisme.fr",
    });
    await insertCfa({
      email: "contact@organisme2.fr",
    });

    let response = await httpClient.get("/api/admin/cfas?text=contact@organisme.fr", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.cfas.length, 1);
    assert.strictEqual(response.data.cfas[0].email, "contact@organisme.fr");
  });

  it("Vérifie qu'on peut exporter les cfas injoinables", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100015",
      raison_sociale: "Organisme de formation",
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    let response = await httpClient.get("/api/admin/cfas/injoinables.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"siret";"raison_sociale";"academie";"email";"erreur";"voeux"
"11111111100015";"Organisme de formation";"Île-de-France";"test@apprentissage.beta.gouv.fr";"Erreur technique ou email invalide";"Non"
`
    );
  });

  it("Vérifie qu'on peut exporter les cfas à relancer", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100015",
      raison_sociale: "Organisme de formation",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "en attente",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
      },
    });

    let response = await httpClient.get("/api/admin/cfas/relances.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"siret";"raison_sociale";"academie";"email";"erreur";"voeux";"statut";"nb_voeux"
"11111111100015";"Organisme de formation";"Île-de-France";"test@apprentissage.beta.gouv.fr";"";"Oui";"en attente";"1"
`
    );
  });

  it("Vérifie qu'on peut exporter les cfas inconnus", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
        nom: "Organisme de formation",
        ville: "Paris",
      },
    });

    let response = await httpClient.get("/api/admin/cfas/inconnus.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"uai";"nom";"ville";"academie"
"0751234J";"Organisme de formation";"Paris";"Île-de-France"
`
    );
  });

  it("Vérifie qu'il faut être admin pour exporter", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    let response = await httpClient.get("/api/admin/cfas/injoinables.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it("Vérifie qu'on peut voir les consultations de la page stats par académie", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertLog({
      request: {
        method: "GET",
        url: {
          relative: "/api/stats/computeStats/now",
          path: "/api/stats/computeStats/now",
          parameters: {
            academies: "01",
          },
        },
      },
    });

    let response = await httpClient.get("/api/admin/academies", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.length, 37);
    let paris = response.data.find((a) => a.code === "01");
    assert.deepStrictEqual(paris, {
      code: "01",
      nbConsultationStats: 1,
      nom: "Paris",
    });
  });

  it("Vérifie qu'on peut modifier l'adresse email d'un CFA", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      username: "11111111100006",
      email: "x@organisme.com",
    });
    await insertCfa({
      username: "22222222200006",
      email: "y@organisme.com",
    });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/setEmail",
      {
        email: "robert.hue@organisme.com",
      },
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    let found = await Cfa.findOne({ username: "11111111100006" });
    assert.deepStrictEqual(found.email, "robert.hue@organisme.com");
    found = await Cfa.findOne({ username: "22222222200006" });
    assert.deepStrictEqual(found.email, "y@organisme.com");
  });

  it("Vérifie qu'il faut être admin pour changer l'email", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/setEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it("Vérifie qu'on ne peut renvoyer un email de confirmation", async () => {
    let { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100006",
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
        },
      ],
    });
    await insertCfa({
      siret: "22222222200006",
      statut: "en attente",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
        },
      ],
    });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/resendConfirmationEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      "[Rappel] Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : 11111111100006)"
    );
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'il faut être admin pour changer renvoyer un email de confirmation", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/resendConfirmationEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it("Vérifie qu'on peut renvoyer un email d'activation", async () => {
    let { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100006",
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_cfa",
        },
      ],
    });
    await insertCfa({
      username: "22222222200006",
      statut: "confirmé",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_cfa",
        },
      ],
    });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/resendActivationEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "[Rappel] Des voeux Affelnet sont téléchargeables");
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'il faut être admin pour changer renvoyer un email d'activation", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/resendActivationEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it("Vérifie qu'on peut marquer un CFA comme non concerné", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100006",
      statut: "confirmé",
    });
    await insertCfa({
      siret: "22222222200006",
      statut: "confirmé",
    });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/markAsNonConcerne",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.statut, "non concerné");
    let found = await Cfa.findOne({ username: "11111111100006" });
    assert.deepStrictEqual(found.statut, "non concerné");
    found = await Cfa.findOne({ username: "22222222200006" });
    assert.deepStrictEqual(found.statut, "confirmé");
  });

  it("Vérifie qu'il faut être admin pour le statut d'un CFA", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    let { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    let response = await httpClient.put(
      "/api/admin/cfas/11111111100006/markAsNonConcerne",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });
});
