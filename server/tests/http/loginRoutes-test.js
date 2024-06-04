const assert = require("assert");
const config = require("../../src/config");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const { insertUser } = require("../utils/fakeData");
const { activateUser } = require("../../src/common/actions/activateUser");
const { startServer } = require("../utils/testUtils");

describe("loginRoutes", () => {
  it("Vérifie qu'on peut se connecter", async () => {
    const { httpClient } = await startServer();
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
    });
    await activateUser("user1", "password");

    const response = await httpClient.post("/api/login", {
      username: "user1",
      password: "password",
    });

    assert.strictEqual(response.status, 200);
    const decoded = jwt.verify(response.data.token, config.auth.apiToken.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.deepStrictEqual(_.omit(decoded, ["iat", "exp"]), {
      sub: "user1",
      iss: "voeux-affelnet",
      permissions: {
        isAdmin: false,
      },
    });
  });

  // it("Vérifie qu'on peut se connecter en lowercase avec un uai", async () => {
  //   const { httpClient } = await startServer();
  //   await insertUser({
  //     username: "3319338X",
  //     email: "user1@apprentissage.beta.gouv.fr",
  //   });
  //   await activateUser("3319338X", "password");

  //   const response = await httpClient.post("/api/login", {
  //     username: "3319338x",
  //     password: "password",
  //   });

  //   assert.strictEqual(response.status, 200);
  // });

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    const { httpClient } = await startServer();
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      isAdmin: true,
    });
    await activateUser("user1", "password");

    const response = await httpClient.post("/api/login", {
      username: "user1",
      password: "INVALID",
    });

    assert.strictEqual(response.status, 401);
  });

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.post("/api/login", {
      username: "INVALID",
      password: "INVALID",
    });

    assert.strictEqual(response.status, 401);
  });

  it("Vérifie qu'un utilisateur en attente est rejeté", async () => {
    const { httpClient } = await startServer();
    await insertUser({
      username: "user1",
      statut: "en attente",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    const response = await httpClient.post("/api/login", {
      username: "user1",
      password: "password",
    });

    assert.strictEqual(response.status, 401);
  });

  it("Vérifie qu'un utilisateur confirmé est rejeté", async () => {
    const { httpClient } = await startServer();
    await insertUser({
      username: "user1",
      statut: "confirmé",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    const response = await httpClient.post("/api/login", {
      username: "user1",
      password: "password",
    });

    assert.strictEqual(response.status, 401);
  });
});
