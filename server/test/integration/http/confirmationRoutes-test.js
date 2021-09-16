const assert = require("assert");
const httpTests = require("../utils/httpTests");
const { insertCfa } = require("../utils/fakeData");
const { createActionToken } = require("../../../src/common/utils/jwtUtils");
const { User } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'un cfa peut récupérer son statut", async () => {
    let { httpClient } = await startServer();
    await insertCfa({
      username: "0751234J",
      email: "0751234J@apprentissage.beta.gouv.fr",
      email_source: "directeur",
    });

    let response = await httpClient.get(`/api/confirmation/status?token=${createActionToken("0751234J")}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      email: "0751234J@apprentissage.beta.gouv.fr",
      email_source: "directeur",
    });
  });

  it("Vérifie qu'une erreur est retourné quand l'état de l'utilisateur ne permet plus la confirmation", async () => {
    let { httpClient } = await startServer();
    await insertCfa({
      username: "0751234J",
      statut: "confirmé",
    });

    let response = await httpClient.get(`/api/confirmation/status?token=${createActionToken("0751234J")}`);

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(response.data, {
      error: "Bad Request",
      message: `Une confirmation a déjà été enregistrée pour le cfa 0751234J`,
      statusCode: 400,
    });
  });

  it("Vérifie qu'un cfa peut confirmer un compte", async () => {
    let { httpClient } = await startServer();
    await insertCfa({
      username: "0751234J",
      email: "0751234J@apprentissage.beta.gouv.fr",
      email_source: "directeur",
    });

    let response = await httpClient.post("/api/confirmation/accept", {
      actionToken: createActionToken("0751234J"),
      email: "0751234J@apprentissage.beta.gouv.fr",
    });

    assert.strictEqual(response.status, 200);
    let found = await User.findOne({ username: "0751234J" }, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });

  it("Vérifie qu'un cfa peut confirmer un compte directeur avec une nouvelle adresse email", async () => {
    let { httpClient } = await startServer();
    await insertCfa({
      username: "0751234J",
      email: "0751234J@apprentissage.beta.gouv.fr",
      email_source: "directeur",
    });

    let response = await httpClient.post("/api/confirmation/accept", {
      actionToken: createActionToken("0751234J"),
      email: "user2@apprentissage.beta.gouv.fr",
    });

    assert.strictEqual(response.status, 200);
    let found = await User.findOne({ username: "0751234J" }, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
    assert.strictEqual(found.email, "user2@apprentissage.beta.gouv.fr");
  });

  it("Vérifie qu'on envoie l'email d'activation après la confirmation", async () => {
    let { httpClient, getEmailsSent } = await startServer();
    await insertCfa({
      username: "0751234J",
      email: "0751234J@apprentissage.beta.gouv.fr",
      email_source: "directeur",
      voeux_date: new Date(),
    });

    let response = await httpClient.post("/api/confirmation/accept", {
      actionToken: createActionToken("0751234J"),
      email: "0751234J@apprentissage.beta.gouv.fr",
    });

    assert.strictEqual(response.status, 200);
    let emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "0751234J@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "Activation de votre compte pour l'UAI 0751234J");
  });

  it("Vérifie qu'une erreur est retourné quand le token est invalide", async () => {
    let { httpClient } = await startServer();
    await insertCfa({
      username: "0751234J",
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
