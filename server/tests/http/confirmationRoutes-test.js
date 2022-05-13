const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const { createActionToken } = require("../../src/common/utils/jwtUtils");
const { Cfa } = require("../../src/common/model");
const { startServer } = require("../utils/testUtils");

describe("confirmationRoutes", () => {
  it("Vérifie qu'un cfa peut récupérer son statut", async () => {
    const { httpClient } = await startServer();
    await insertCfa({
      username: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    const response = await httpClient.get(`/api/confirmation/status?token=${createActionToken("11111111100006")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });
  });

  it("Vérifie qu'une erreur est retourné quand l'état de l'utilisateur ne permet plus la confirmation", async () => {
    const { httpClient } = await startServer();
    await insertCfa({
      username: "11111111100006",
      statut: "confirmé",
    });

    const response = await httpClient.get(`/api/confirmation/status?token=${createActionToken("11111111100006")}`);

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(response.data, {
      error: "Bad Request",
      message: `Une confirmation a déjà été enregistrée pour le cfa 11111111100006`,
      statusCode: 400,
    });
  });

  it("Vérifie qu'un cfa peut confirmer un compte", async () => {
    const { httpClient } = await startServer();
    await insertCfa({
      username: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    const response = await httpClient.post("/api/confirmation/accept", {
      actionToken: createActionToken("11111111100006"),
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    assert.strictEqual(response.status, 200);
    const found = await Cfa.findOne({ username: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });

  it("Vérifie qu'un cfa peut confirmer un compte avec une nouvelle adresse email", async () => {
    const { httpClient } = await startServer();
    await insertCfa({
      username: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    const response = await httpClient.post("/api/confirmation/accept", {
      actionToken: createActionToken("11111111100006"),
      email: "user2@apprentissage.beta.gouv.fr",
    });

    assert.strictEqual(response.status, 200);
    const found = await Cfa.findOne({ username: "11111111100006" }, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
    assert.strictEqual(found.email, "user2@apprentissage.beta.gouv.fr");
  });

  it("Vérifie qu'on envoie l'email d'activation après la confirmation", async () => {
    const { httpClient, getEmailsSent } = await startServer();
    await insertCfa({
      username: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
    });

    const response = await httpClient.post("/api/confirmation/accept", {
      actionToken: createActionToken("11111111100006"),
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    assert.strictEqual(response.status, 200);
    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "11111111100006@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "Des voeux Affelnet sont téléchargeables");
  });

  it("Vérifie qu'une erreur est retourné quand le token est invalide", async () => {
    const { httpClient } = await startServer();
    await insertCfa({
      username: "11111111100006",
    });

    let response = await httpClient.get(`/api/confirmation/status?token=INVALID`);
    assert.strictEqual(response.status, 401);
    assert.deepStrictEqual(response.data, {
      error: "Unauthorized",
      message: "Unauthorized",
      statusCode: 401,
    });

    response = await httpClient.post("/api/confirmation/accept", {
      actionToken: "INVALID",
    });
    assert.strictEqual(response.status, 401);
    assert.deepStrictEqual(response.data, {
      error: "Unauthorized",
      message: "Unauthorized",
      statusCode: 401,
    });
  });
});
