const assert = require("assert");
const { DateTime } = require("luxon");
const { Gestionnaire } = require("../../src/common/model");
const { date } = require("../../src/common/utils/csvUtils.js");

const { insertGestionnaire, insertVoeu, insertLog } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");
const { omit } = require("lodash");

describe("adminRoutes", () => {
  xit("Vérifie qu'on peut obtenir la liste des gestionnaires", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertGestionnaire({
      username: "11111111100006",
      password: "12345",
      email: "contact@organisme.com",
      raison_sociale: "Organisme de formation",
    });

    const response = await httpClient.get("/api/admin/gestionnaires", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      gestionnaires: [
        {
          statut: "en attente",
          isAdmin: false,
          unsubscribe: false,
          type: "Gestionnaire",
          username: "11111111100006",
          siret: "11111111100006",
          raison_sociale: "Organisme de formation",
          academie: { code: "01", nom: "Paris" },
          email: "contact@organisme.com",
          formateurs: [],
          emails: [],
          anciens_emails: [],
          voeux_telechargements: [],
        },
      ],
      pagination: { page: 1, items_par_page: 10, nombre_de_page: 1, total: 1 },
    });
  });

  xit("Vérifie qu'on peut obtenir la liste paginée des gestionnaires ", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertGestionnaire({ username: "13000460900017" });
    await insertGestionnaire({ username: "13001400400043" });
    await insertGestionnaire({ username: "13001727000823" });
    await insertGestionnaire({ username: "13002068800011" });
    await insertGestionnaire({ username: "13002087800240" });
    await insertGestionnaire({ username: "13002172800014" });
    await insertGestionnaire({ username: "13002175100131" });
    await insertGestionnaire({ username: "13002245200036" });
    await insertGestionnaire({ username: "13002271800014" });
    await insertGestionnaire({ username: "13002280900029" });
    await insertGestionnaire({ username: "13002280900110" });
    await insertGestionnaire({ username: "13002293200086" });
    await insertGestionnaire({ username: "13002374000439" });
    await insertGestionnaire({ username: "13002792300049" });
    await insertGestionnaire({ username: "13002792300056" });
    await insertGestionnaire({ username: "13002792300080" });
    await insertGestionnaire({ username: "13002792300155" });
    await insertGestionnaire({ username: "13002792300171" });
    await insertGestionnaire({ username: "13002792300205" });
    await insertGestionnaire({ username: "13002792300221" });
    await insertGestionnaire({ username: "13002792300262" });
    await insertGestionnaire({ username: "13002792300320" });
    await insertGestionnaire({ username: "13002792300353" });
    await insertGestionnaire({ username: "13002792300361" });
    await insertGestionnaire({ username: "13002793100042" });
    await insertGestionnaire({ username: "13002793100067" });
    await insertGestionnaire({ username: "13002793100117" });
    await insertGestionnaire({ username: "13002793100141" });
    await insertGestionnaire({ username: "13002793100216" });
    await insertGestionnaire({ username: "13002793100232" });
    await insertGestionnaire({ username: "13002793100281" });
    await insertGestionnaire({ username: "13002793100299" });
    await insertGestionnaire({ username: "13002793100356" });
    await insertGestionnaire({ username: "13002794900093" });
    await insertGestionnaire({ username: "13002794900135" });
    await insertGestionnaire({ username: "13002794900150" });
    await insertGestionnaire({ username: "13002794900168" });
    await insertGestionnaire({ username: "13002794900218" });
    await insertGestionnaire({ username: "13002794900242" });
    await insertGestionnaire({ username: "13002794900259" });
    await insertGestionnaire({ username: "13002797200129" });
    await insertGestionnaire({ username: "13002797200160" });
    await insertGestionnaire({ username: "13002797200285" });
    await insertGestionnaire({ username: "13002797200293" });
    await insertGestionnaire({ username: "13002797200301" });
    await insertGestionnaire({ username: "13002798000015" });
    await insertGestionnaire({ username: "13002799800017" });
    await insertGestionnaire({ username: "13002804600022" });
    await insertGestionnaire({ username: "13002948100095" });

    const response = await httpClient.get("/api/admin/gestionnaires?page=2", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.gestionnaires.length, 10);
    assert.deepStrictEqual(response.data.gestionnaires.filter((c) => c.siret === "13002271800014").length, 0);
  });

  xit("Vérifie qu'on peut filtrer les gestionnaires", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertGestionnaire({
      email: "contact@organisme.fr",
    });
    await insertGestionnaire({
      email: "contact@organisme2.fr",
    });

    const response = await httpClient.get("/api/admin/gestionnaires?text=contact@organisme.fr", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.gestionnaires.length, 1);
    assert.strictEqual(response.data.gestionnaires[0].email, "contact@organisme.fr");
  });

  xit("Vérifie qu'on peut exporter les gestionnaires injoinables", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const sendDate = new Date();
    await insertGestionnaire({
      siret: "11111111100015",
      raison_sociale: "Organisme de formation",
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation_user",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [sendDate],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    const response = await httpClient.get("/api/admin/fichiers/injoinables.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"siret";"formateurs";"raison_sociale";"academie";"email";"erreur";"voeux";"dernier_email";"dernier_email_date"
"11111111100015";"";"Organisme de formation";"Paris";"test@apprentissage.beta.gouv.fr";"Erreur technique ou email invalide";"Non";"activation_user";"${date(
        sendDate
      )}"
`
    );
  });

  xit("Vérifie qu'on peut exporter les gestionnaires à relancer", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertGestionnaire({
      siret: "11111111100015",
      raison_sociale: "Organisme de formation",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "en attente",
      emails: [
        {
          token: "token1",
          templateName: "confirmation",
          sendDates: ["2023-05-13T16:20:39.495Z", "2023-05-14T16:20:39.495Z"],
        },
        {
          token: "token2",
          templateName: "activation_gestionnaire",
          sendDates: ["2023-05-16T16:20:39.495Z", "2023-05-18T16:20:39.495Z"],
        },
      ],
      formateurs: [{ uai: "0751234J", voeux_date: new Date() }],
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "0751234J",
      },
    });

    const response = await httpClient.get("/api/admin/fichiers/relances.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"siret";"formateurs";"raison_sociale";"academie";"email";"erreur";"voeux";"dernier_email";"dernier_email_date";"statut";"nb_voeux"
"11111111100015";"0751234J";"Organisme de formation";"Paris";"test@apprentissage.beta.gouv.fr";"";"Oui";"activation_gestionnaire";"${date(
        new Date("2023-05-18T16:20:39.495Z")
      )}";"en attente";"1"
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

    const response = await httpClient.get("/api/admin/fichiers/inconnus.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"uai";"nom";"ville";"academie"
"0751234J";"Organisme de formation";"Paris";"Paris"
`
    );
  });

  it("Vérifie qu'il faut être admin pour exporter", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.get("/api/admin/fichiers/injoinables.csv", {
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

  xit("Vérifie qu'on peut exporter le statut des téléchargements des voeux", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertGestionnaire({
      siret: "11111111100015",
      raison_sociale: "Organisme de formation",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      formateurs: [
        { uai: "1234567A", voeux_date: DateTime.fromISO("2023-06-15T00:00:00.000Z") },
        { uai: "1234567B", voeux_date: DateTime.fromISO("2023-06-10T00:00:00.000Z") },
        { uai: "1234567C" },
      ],
      voeux_telechargements: [
        {
          uai: "1234567A",
          date: DateTime.fromISO("2023-06-05T00:00:00.000Z").plus({ hours: 12 }),
        },
        {
          uai: "1234567A",
          date: DateTime.fromISO("2023-06-05T00:00:00.000Z").plus({ days: 1 }),
        },
        {
          uai: "1234567B",
          date: DateTime.fromISO("2023-06-15T00:00:00.000Z").plus({ days: 1 }),
        },
      ],
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "1234567A",
      },
      _meta: {
        import_dates: [DateTime.fromISO("2023-06-05T00:00:00.000Z"), DateTime.fromISO("2023-06-15T00:00:00.000Z")],
      },
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "1234567A",
      },
      _meta: {
        import_dates: [DateTime.fromISO("2023-06-05T00:00:00.000Z")],
      },
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "1234567A",
      },
      _meta: {
        import_dates: [DateTime.fromISO("2023-06-10T00:00:00.000Z"), DateTime.fromISO("2023-06-15T00:00:00.000Z")],
      },
    });

    await insertVoeu({
      etablissement_accueil: {
        uai: "1234567B",
      },
      _meta: {
        import_dates: [DateTime.fromISO("2023-06-10T00:00:00.000Z")],
      },
    });
    await insertVoeu({
      etablissement_accueil: {
        uai: "1234567B",
      },
      _meta: {
        import_dates: [DateTime.fromISO("2023-06-10T00:00:00.000Z")],
      },
    });

    const response = await httpClient.get("/api/admin/fichiers/statut-voeux.csv", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.data,
      `"Académie";"Siret de l’organisme responsable";"Raison sociale de l’organisme responsable";"Email de contact de l’organisme responsable";"Uai";"Raison sociale de l’établissement d’accueil";"Type de l'établissement d'accueil";"Statut ";"Vœux";"Nombre de vœux";"Date du dernier import de vœux";"Téléchargement";"Téléchargement effectué pour tous les établissements d’accueil liés ?";"Date du dernier téléchargement";"Nombre de vœux téléchargés au moins une fois";"Nombre de vœux jamais téléchargés";"Nombre de vœux à télécharger (nouveau+maj)"
"Paris";"11111111100015";"Organisme de formation";"test@apprentissage.beta.gouv.fr";"1234567A";"";"";"contact responsable confirmé";"Oui";"3";"${date(
        new Date("2023-06-15T00:00:00.000Z")
      )}";"Oui";"Oui";"${date(new Date("2023-06-06T00:00:00.000Z"))}";"2";"1";"2"
"Paris";"11111111100015";"Organisme de formation";"test@apprentissage.beta.gouv.fr";"1234567B";"";"";"contact responsable confirmé";"Oui";"2";"${date(
        new Date("2023-06-10T00:00:00.000Z")
      )}";"Oui";"Oui";"${date(new Date("2023-06-16T00:00:00.000Z"))}";"2";"0";"0"
"Paris";"11111111100015";"Organisme de formation";"test@apprentissage.beta.gouv.fr";"1234567C";"";"";"contact responsable confirmé";"Non";"0";"";"Non";"Oui";"";"0";"0";"0"
`
    );
  });

  xit("Vérifie qu'on peut voir les consultations de la page stats par académie", async () => {
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

  it("Vérifie qu'on peut modifier l'adresse email d'un formateur", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    await insertGestionnaire({
      username: "11111111100006",
      email: "x@organisme.com",
    });
    await insertGestionnaire({
      username: "22222222200006",
      email: "y@organisme.com",
    });

    const response = await httpClient.put(
      "/api/admin/gestionnaires/11111111100006/setEmail",
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
    let found = await Gestionnaire.findOne({ username: "11111111100006" }).lean();
    assert.deepStrictEqual(found.email, "robert.hue@organisme.com");
    const ancien = found.anciens_emails[0];
    assert.deepStrictEqual(omit(ancien, ["modification_date"]), {
      email: "x@organisme.com",
      auteur: "admin",
    });
    assert.ok(ancien.modification_date);
    found = await Gestionnaire.findOne({ username: "22222222200006" }).lean();
    assert.deepStrictEqual(found.email, "y@organisme.com");
  });

  it("Vérifie qu'il faut être admin pour changer l'email", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
      "/api/admin/gestionnaires/11111111100006/setEmail",
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
    await insertGestionnaire({
      siret: "11111111100006",
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation_gestionnaire",
        },
      ],
    });
    await insertGestionnaire({
      siret: "22222222200006",
      statut: "en attente",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation_gestionnaire",
        },
      ],
    });

    const response = await httpClient.put(
      "/api/admin/gestionnaires/11111111100006/resendConfirmationEmail",
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
      "[Rappel] Affelnet apprentissage – Information requise pour la transmission des vœux 2023 (SIRET : 11111111100006)"
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
      "/api/admin/gestionnaires/11111111100006/resendConfirmationEmail",
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
    await insertGestionnaire({
      siret: "11111111100006",
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_gestionnaire",
        },
      ],
    });
    await insertGestionnaire({
      username: "22222222200006",
      statut: "confirmé",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_gestionnaire",
        },
      ],
    });

    const response = await httpClient.put(
      "/api/admin/gestionnaires/11111111100006/resendActivationEmail",
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
    assert.deepStrictEqual(sent[0].subject, "[Rappel] Des vœux Affelnet sont téléchargeables (SIRET : 11111111100006)");
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
      "/api/admin/gestionnaires/11111111100006/resendActivationEmail",
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
    await insertGestionnaire({
      siret: "11111111100006",
      statut: "confirmé",
    });
    await insertGestionnaire({
      siret: "22222222200006",
      statut: "confirmé",
    });

    const response = await httpClient.put(
      "/api/admin/gestionnaires/11111111100006/markAsNonConcerne",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.statut, "non concerné");
    let found = await Gestionnaire.findOne({ username: "11111111100006" });
    assert.deepStrictEqual(found.statut, "non concerné");
    found = await Gestionnaire.findOne({ username: "22222222200006" });
    assert.deepStrictEqual(found.statut, "confirmé");
  });

  it("Vérifie qu'il faut être admin pour le statut d'un CFA", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
      "/api/admin/gestionnaires/11111111100006/markAsNonConcerne",
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
