const assert = require("assert");
const { startServer } = require("../utils/testUtils");

describe("healthcheckRoutes", () => {
  it.skip("Vérifie que le server fonctionne", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/healthcheck");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.healthcheck, true);
  });

  it.skip("Vérifie qu'on peut générer une erreur", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/healthcheck/error");

    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(response.data, {
      error: "Internal Server Error",
      message: "An internal server error occurred",
      statusCode: 500,
    });
  });
});
