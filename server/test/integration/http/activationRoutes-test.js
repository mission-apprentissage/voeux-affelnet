const assert = require("assert");
const config = require("../../../src/config");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const httpTests = require("../utils/httpTests");
const { insertCfa, insertUser } = require("../utils/fakeData");
const { createActionToken } = require("../../../src/common/utils/jwtUtils");

httpTests(__filename, ({ startServer }) => {
  it.only("Vérifie qu'un utilisateur peut vérifier son statut", async () => {
    let { httpClient } = await startServer();
    let user = await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    let response = await httpClient.get(`/api/activation/status?token=${createActionToken(user.username)}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {});
  });

  it.only("Vérifie qu'une erreur est retourné quand l'état de l'utilisateur ne permet plus l'activation", async () => {
    let { httpClient } = await startServer();
    let user = await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      statut: "activé",
    });

    let response = await httpClient.get(`/api/activation/status?token=${createActionToken(user.username)}`);

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(response.data, {
      error: "Bad Request",
      message: `L'utilisateur user1 est déjà activé`,
      statusCode: 400,
    });
  });

  it.only("Vérifie qu'un utilisateur peut activer un compte", async () => {
    let { httpClient } = await startServer();
    let user = await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      isAdmin: true,
    });

    let response = await httpClient.post("/api/activation", {
      actionToken: createActionToken(user.username),
      password: "Password!123456",
    });

    assert.strictEqual(response.status, 200);
    let decoded = jwt.verify(response.data.token, config.auth.apiToken.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.deepStrictEqual(_.omit(decoded, ["iat", "exp"]), {
      sub: "user1",
      iss: "voeux-affelnet",
      permissions: {
        isAdmin: true,
      },
    });
  });

  it.only("Vérifie qu'un CFA peut activer un compte", async () => {
    let { httpClient } = await startServer();
    await insertCfa({ username: "0751234J" });

    let response = await httpClient.post("/api/activation", {
      actionToken: createActionToken("0751234J"),
      password: "Password!123456",
    });

    assert.strictEqual(response.status, 200);
    let decoded = jwt.verify(response.data.token, config.auth.apiToken.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.deepStrictEqual(_.omit(decoded, ["iat", "exp"]), {
      sub: "0751234J",
      iss: "voeux-affelnet",
      type: "Cfa",
      permissions: {
        isAdmin: false,
      },
    });
  });

  it.only("Vérifie qu'on doit spécifier un mot de passe valide", async () => {
    let { httpClient } = await startServer();
    await insertCfa({ username: "0751234J" });

    let response = await httpClient.post("/api/activation", {
      actionToken: createActionToken("0751234J"),
      password: "too weak",
    });

    assert.strictEqual(response.status, 400);
  });

  it.only("Vérifie qu'on ne peut pas créer de compte avec un token invalide", async () => {
    let { httpClient } = await startServer();

    let response = await httpClient.post("/api/activation", {
      actionToken: "INVALID",
      password: "Password!123456",
    });

    assert.strictEqual(response.status, 401);
  });

  it.only("Vérifie qu'on ne peut pas créer de compte avec un token expiré", async () => {
    let { httpClient } = await startServer();
    await insertCfa({ username: "0751234J" });

    let response = await httpClient.post("/api/activation", {
      actionToken: createActionToken("0751234J", { expiresIn: "1ms" }),
      password: "Password!123456",
    });

    assert.strictEqual(response.status, 401);
  });

  it.only("Vérifie qu'on ne peut pas utiliser plusieurs fois un token", async () => {
    let { httpClient } = await startServer();
    await insertCfa({ username: "0751234J" });

    let response = await httpClient.post("/api/activation", {
      actionToken: createActionToken("0751234J"),
      password: "Password!123456",
    });
    assert.strictEqual(response.status, 200);

    response = await httpClient.post("/api/activation", {
      actionToken: createActionToken("0751234J"),
      password: "Password!123456",
    });

    assert.strictEqual(response.status, 400);
  });

  it.only("Vérifie qu'on ne peut pas créer de compte avec un token forgé", async () => {
    let { httpClient } = await startServer();
    await insertCfa({ username: "0751234J" });

    let response = await httpClient.post("/api/activation", {
      actionToken: createActionToken("0751234J", { secret: "fake-secret" }),
      password: "Password!123456",
    });

    assert.strictEqual(response.status, 401);
  });
});
