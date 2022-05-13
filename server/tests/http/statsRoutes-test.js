const assert = require("assert");
const { JobEvent } = require("../../src/common/model");
const { startServer } = require("../utils/testUtils");

describe("statsRoutes", () => {
  it("Vérifie qu'on peut obtenir des stats", async () => {
    let { httpClient } = await startServer();
    await JobEvent.create({
      job: "computeStats",
      date: "2021-05-11T07:14:04.182Z",
      stats: {
        value: 1,
      },
    });

    let response = await httpClient.get("/api/stats/computeStats");

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      results: [
        {
          job: "computeStats",
          date: "2021-05-11T07:14:04.182Z",
          type: "JobEvent",
          stats: {
            value: 1,
          },
        },
      ],
    });
  });

  it("Vérifie qu'on peut obtenir des stats instantanées pour toutes les académies", async () => {
    let { httpClient } = await startServer();
    await JobEvent.create({
      job: "computeStats",
      date: "2021-05-11T07:14:04.182Z",
      stats: {
        value: 1,
      },
    });

    let response = await httpClient.get("/api/stats/computeStats/now");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.stats["cfas"].length, 41);
    assert.strictEqual(response.data.stats["emails"].length, 41);
    assert.strictEqual(response.data.stats["téléchargements"].length, 41);
    assert.strictEqual(response.data._meta.academies.length, 41);
  });

  it("Vérifie qu'on peut obtenir des stats instantanées par académie", async () => {
    let { httpClient } = await startServer();
    await JobEvent.create({
      job: "computeStats",
      date: "2021-05-11T07:14:04.182Z",
      stats: {
        value: 1,
      },
    });

    let response = await httpClient.get("/api/stats/computeStats/now?academies=01");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.stats["cfas"].length, 1);
    assert.strictEqual(response.data.stats["emails"].length, 1);
    assert.strictEqual(response.data.stats["téléchargements"].length, 1);
    assert.strictEqual(response.data._meta.academies.length, 41);
  });
});
