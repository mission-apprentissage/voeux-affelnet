const assert = require("assert");
const { Cfa } = require("../../src/common/model");
const { insertCfa, insertVoeu, insertLog } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");
const { omit } = require("lodash");

describe("adminRoutes", () => {
  it("Vérifie qu'on peut obtenir la liste des cfas", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      username: "11111111100006",
      password: "12345",
      email: "contact@organisme.com",
      raison_sociale: "Organisme de formation",
    });

    const response = await httpClient.get("/api/admin/cfas", {
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
          etablissements: [],
          emails: [],
          anciens_emails: [],
          voeux_telechargements: [],
        },
      ],
      pagination: { page: 1, items_par_page: 10, nombre_de_page: 1, total: 1 },
    });
  });

  it("Vérifie qu'on peut obtenir la liste paginée des cfas ", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({ username: "13000460900017" });
    await insertCfa({ username: "13001400400043" });
    await insertCfa({ username: "13001727000823" });
    await insertCfa({ username: "13002068800011" });
    await insertCfa({ username: "13002087800240" });
    await insertCfa({ username: "13002172800014" });
    await insertCfa({ username: "13002175100131" });
    await insertCfa({ username: "13002245200036" });
    await insertCfa({ username: "13002271800014" });
    await insertCfa({ username: "13002280900029" });
    await insertCfa({ username: "13002280900110" });
    await insertCfa({ username: "13002293200086" });
    await insertCfa({ username: "13002374000439" });
    await insertCfa({ username: "13002792300049" });
    await insertCfa({ username: "13002792300056" });
    await insertCfa({ username: "13002792300080" });
    await insertCfa({ username: "13002792300155" });
    await insertCfa({ username: "13002792300171" });
    await insertCfa({ username: "13002792300205" });
    await insertCfa({ username: "13002792300221" });
    await insertCfa({ username: "13002792300262" });
    await insertCfa({ username: "13002792300320" });
    await insertCfa({ username: "13002792300353" });
    await insertCfa({ username: "13002792300361" });
    await insertCfa({ username: "13002793100042" });
    await insertCfa({ username: "13002793100067" });
    await insertCfa({ username: "13002793100117" });
    await insertCfa({ username: "13002793100141" });
    await insertCfa({ username: "13002793100216" });
    await insertCfa({ username: "13002793100232" });
    await insertCfa({ username: "13002793100281" });
    await insertCfa({ username: "13002793100299" });
    await insertCfa({ username: "13002793100356" });
    await insertCfa({ username: "13002794900093" });
    await insertCfa({ username: "13002794900135" });
    await insertCfa({ username: "13002794900150" });
    await insertCfa({ username: "13002794900168" });
    await insertCfa({ username: "13002794900218" });
    await insertCfa({ username: "13002794900242" });
    await insertCfa({ username: "13002794900259" });
    await insertCfa({ username: "13002797200129" });
    await insertCfa({ username: "13002797200160" });
    await insertCfa({ username: "13002797200285" });
    await insertCfa({ username: "13002797200293" });
    await insertCfa({ username: "13002797200301" });
    await insertCfa({ username: "13002798000015" });
    await insertCfa({ username: "13002799800017" });
    await insertCfa({ username: "13002804600022" });
    await insertCfa({ username: "13002948100095" });

    const response = await httpClient.get("/api/admin/cfas?page=2", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.cfas.length, 10);
    assert.deepStrictEqual(response.data.cfas.filter((c) => c.siret === "13002271800014").length, 0);
  });

  it("Vérifie qu'on peut filtrer les cfas", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      email: "contact@organisme.fr",
    });
    await insertCfa({
      email: "contact@organisme2.fr",
    });

    const response = await httpClient.get("/api/admin/cfas?text=contact@organisme.fr", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.cfas.length, 1);
    assert.strictEqual(response.data.cfas[0].email, "contact@organisme.fr");
  });

  it("Vérifie qu'on peut exporter les cfas injoinables", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100015",
      raison_sociale: "Organisme de formation",
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation_user",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    const response = await httpClient.get("/api/admin/cfas/injoinables.csv", {
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
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
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

    const response = await httpClient.get("/api/admin/cfas/relances.csv", {
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

  it("Vérifie qu'on peut exporter les établissements inconnus", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
        nom: "Organisme de formation",
        ville: "Paris",
      },
    });

    const response = await httpClient.get("/api/admin/etablissements/inconnus.csv?relations=false", {
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
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.get("/api/admin/cfas/injoinables.csv", {
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
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
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

    const response = await httpClient.get("/api/admin/academies", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.length, 37);
    const paris = response.data.find((a) => a.code === "01");
    assert.deepStrictEqual(paris, {
      code: "01",
      nbConsultationStats: 1,
      nom: "Paris",
    });
  });

  it("Vérifie qu'on peut modifier l'adresse email d'un CFA", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      username: "11111111100006",
      email: "x@organisme.com",
    });
    await insertCfa({
      username: "22222222200006",
      email: "y@organisme.com",
    });

    const response = await httpClient.put(
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
    let found = await Cfa.findOne({ username: "11111111100006" }).lean();
    assert.deepStrictEqual(found.email, "robert.hue@organisme.com");
    const ancien = found.anciens_emails[0];
    assert.deepStrictEqual(omit(ancien, ["modification_date"]), {
      email: "x@organisme.com",
      auteur: "admin",
    });
    assert.ok(ancien.modification_date);
    found = await Cfa.findOne({ username: "22222222200006" }).lean();
    assert.deepStrictEqual(found.email, "y@organisme.com");
  });

  it("Vérifie qu'il faut être admin pour changer l'email", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
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
    const { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
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

    const response = await httpClient.put(
      "/api/admin/cfas/11111111100006/resendConfirmationEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      "[Rappel] Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : 11111111100006)"
    );
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'il faut être admin pour changer renvoyer un email de confirmation", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
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
    const { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
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

    const response = await httpClient.put(
      "/api/admin/cfas/11111111100006/resendActivationEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "[Rappel] Des vœux Affelnet sont téléchargeables (Siret : 11111111100006)");
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'il faut être admin pour changer renvoyer un email d'activation", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
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
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertCfa({
      siret: "11111111100006",
      statut: "confirmé",
    });
    await insertCfa({
      siret: "22222222200006",
      statut: "confirmé",
    });

    const response = await httpClient.put(
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
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
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
