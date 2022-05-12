const assert = require("assert");
const httpTests = require("../utils/httpTests");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que le server fonctionne", async () => {
    let { httpClient } = await startServer();

    let response = await httpClient.get("/api/healthcheck");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.healthcheck, true);
  });

  it("Vérifie qu'on peut générer une erreur", async () => {
    let { httpClient } = await startServer();

    let response = await httpClient.get("/api/healthcheck/error");

    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(response.data, {
      error: "Internal Server Error",
      message: "An internal server error occurred",
      statusCode: 500,
    });
  });
});
