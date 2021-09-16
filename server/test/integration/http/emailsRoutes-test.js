const assert = require("assert");
const httpTests = require("../utils/httpTests");
const { waitUntil } = require("../utils/testUtils");
const { insertUser } = require("../utils/fakeData");
const { User } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut prévisualier un email", async () => {
    let { httpClient, components } = await startServer();
    let { emails } = components;
    let user = await insertUser({ email: "test@apprentissage.beta.gouv.fr" });
    let token = await emails.send(user, "activation");

    let response = await httpClient.get(`/api/emails/${token}/preview`);

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.startsWith("<!doctype html><html "));
  });

  it("Vérifie qu'on ne peut pas prévisualiser un token invalide", async () => {
    let { httpClient } = await startServer();

    let response = await httpClient.get(`/api/emails/INVALID/preview`);

    assert.strictEqual(response.status, 404);
  });

  it("Vérifie qu'on peut marquer un email comme ouvert", async () => {
    let { httpClient, components } = await startServer();
    let { emails } = components;
    let user = await insertUser({ email: "test@apprentissage.beta.gouv.fr" });
    let token = await emails.send(user, "activation");

    let response = await httpClient.get(`/api/emails/${token}/markAsOpened`);

    await waitUntil(async () => User.find({ "emails.openDate": { $exists: true } }));
    assert.strictEqual(response.status, 200);
  });

  it("Vérifie qu'un utilisateur peut se désinscrire du service", async () => {
    let { httpClient, components } = await startServer();
    let { emails } = components;
    let user = await insertUser({ email: "test@apprentissage.beta.gouv.fr", statut: "confirmé" });
    let token = await emails.send(user, "activation");

    let response = await httpClient.get(`/api/emails/${token}/unsubscribe`);

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.startsWith("<!DOCTYPE html>"));
    let found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" });
    assert.strictEqual(found.unsubscribe, true);
  });

  it("Vérifie qu'on ne peut se désinscrive avec un token invalide", async () => {
    let { httpClient } = await startServer();

    let response = await httpClient.get(`/api/emails/INVALID/unsubscribe`);

    assert.strictEqual(response.status, 404);
  });

  it("Vérifie qu'on peut prendre en compte des notifications d'erreur via webhook", async () => {
    let { httpClient } = await startServer();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          messageIds: ["60ae479632bd2611ce1bfd54@domain.com"],
        },
      ],
    });

    let response = await httpClient.post(`/api/emails/webhook?webhookKey=1234`, {
      event: "soft_bounce",
      "message-id": "60ae479632bd2611ce1bfd54@domain.com",
      id: 385857,
      date: "2021-05-26 17:19:32",
      ts: 1622042372,
      email: "test@apprentissage.beta.gouv.fr",
      ts_event: 1622042372,
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {});
    let found = await waitUntil(
      () =>
        User.findOne({ "emails.error": { $exists: true } })
          .lean()
          .exec(),
      {
        times: 250,
      }
    );
    assert.deepStrictEqual(found.emails[0].error, {
      type: "soft_bounce",
    });
  });

  it("Vérifie qu'on peut prendre en compte des notifications de réception via webhook", async () => {
    let { httpClient } = await startServer();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          messageIds: ["60ae479632bd2611ce1bfd54@domain.com"],
          error: {
            type: "soft_bounce",
          },
        },
      ],
    });

    let response = await httpClient.post(`/api/emails/webhook?webhookKey=1234`, {
      event: "delivered",
      "message-id": "60ae479632bd2611ce1bfd54@domain.com",
      id: 385857,
      date: "2021-05-26 17:19:32",
      ts: 1622042372,
      email: "test@apprentissage.beta.gouv.fr",
      ts_event: 1622042372,
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {});
    let found = await waitUntil(() => User.findOne().lean());
    assert.ok(!found.emails[0].error);
  });

  it("Vérifie qu'on ne peut pas recevoir des notifications sans webhook key", async () => {
    let { httpClient } = await startServer();

    let response = await httpClient.post(`/api/emails/webhook`, {});

    assert.strictEqual(response.status, 401);
    assert.deepStrictEqual(response.data, {
      error: "Unauthorized",
      message: "Unauthorized",
      statusCode: 401,
    });
  });
});
