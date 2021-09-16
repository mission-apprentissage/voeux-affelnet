const assert = require("assert");
const config = require("../../../src/config");
const { Cfa } = require("../../../src/common/model");
const { createResetPasswordToken } = require("../../../src/common/utils/jwtUtils");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const httpTests = require("../utils/httpTests");
const { insertUser } = require("../utils/fakeData");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'un utilisateur peut faire une demande de réinitialisation de mot de passe", async () => {
    let { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    await createAndLogUser("user1", "password", { isAdmin: true });

    let response = await httpClient.post("/api/password/forgotten-password", {
      username: "user1",
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      message: "Un email a été envoyé.",
    });

    let emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "user1@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "Réinitialisation du mot de passe");
  });

  it("Vérifie qu'un cfa peut faire une demande de réinitialisation de mot de passe en lower case", async () => {
    let { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    await createAndLogUser("0751234J", "password", { model: Cfa });

    let response = await httpClient.post("/api/password/forgotten-password", {
      username: "0751234J",
    });

    assert.strictEqual(response.status, 200);
    let emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
  });

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur inconnu", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("admin", "password", { isAdmin: true });

    let response = await httpClient.post("/api/password/forgotten-password", {
      username: "inconnu",
    });

    assert.strictEqual(response.status, 400);
  });

  it("Vérifie qu'on ne peut pas demander la réinitialisation pour un utilisateur sans mot de passe", async () => {
    let { httpClient } = await startServer();
    await insertUser({
      username: "user1",
    });

    let response = await httpClient.post("/api/password/forgotten-password", {
      username: "user1",
    });

    assert.strictEqual(response.status, 400);
  });

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur invalide", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("cfa456", "password");
    let user = await insertUser();
    delete user.email;
    await user.save();

    let response = await httpClient.post("/api/password/forgotten-password", {
      username: "cfa123",
    });

    assert.strictEqual(response.status, 400);
  });

  it("Vérifie qu'un utilisateur peut changer son mot de passe", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("admin", "password", { isAdmin: true });

    let response = await httpClient.post("/api/password/reset-password", {
      resetPasswordToken: createResetPasswordToken("admin"),
      newPassword: "Password!123456",
    });

    assert.strictEqual(response.status, 200);
    let decoded = jwt.verify(response.data.token, config.auth.apiToken.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.deepStrictEqual(_.omit(decoded, ["iat", "exp"]), {
      sub: "admin",
      iss: "voeux-affelnet",
      permissions: {
        isAdmin: true,
      },
    });
  });

  it("Vérifie qu'on doit spécifier un mot de passe valide", async () => {
    let { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("admin", "password", { isAdmin: true });

    let response = await httpClient.post("/api/password/reset-password", {
      resetPasswordToken: createResetPasswordToken("admin"),
      newPassword: "invalid",
    });

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(response.data, {
      statusCode: 400,
      error: "Bad Request",
      message: "Erreur de validation",
      details: [
        {
          message:
            '"newPassword" with value "invalid" fails to match the required pattern: /^(?=.*[A-Za-z])(?=.*\\d)(?=.*[ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~])[A-Za-z\\d !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]{8,}$/',
          path: ["newPassword"],
          type: "string.pattern.base",
          context: { regex: {}, value: "invalid", label: "newPassword", key: "newPassword" },
        },
      ],
    });
  });
});
