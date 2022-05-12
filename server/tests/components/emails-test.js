const assert = require("assert");
const { insertUser, insertCfa } = require("../utils/fakeData");
const { createFakeSender } = require("../utils/fakeSender");
const { User } = require("../../src/common/model");
const { createTestContext } = require("../utils/testUtils");

describe("emails", () => {
  it("Vérifie qu'on peut envoyer un email", async () => {
    const { sender, getEmailsSent } = createTestContext();
    const user = await insertUser({ email: "test@apprentissage.beta.gouv.fr", username: "0648248W" });

    await sender.send(user, "activation");

    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "Activation de votre compte");
    const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 1);
    assert.strictEqual(found.emails[0].messageIds.length, 1);
    assert.ok(found.emails[0].token);
    assert.strictEqual(found.emails[0].templateName, "activation");
  });

  it("Vérifie qu'on peut renvoyer un email", async () => {
    const { sender, getEmailsSent } = createTestContext();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      username: "0648248W",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
        },
      ],
    });

    await sender.resend("TOKEN1");

    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "[Rappel] Activation de votre compte");
    const found = await User.findOne().lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 2);
  });

  it("Vérifie qu'on envoie un email pour chaque cfa ayant la même adresse email", async () => {
    const { sender } = createTestContext();
    const user1 = await insertCfa({ email: "test@apprentissage.beta.gouv.fr", username: "11111111100006" });
    const user2 = await insertCfa({ email: "test@apprentissage.beta.gouv.fr", username: "22222222200006" });

    await sender.send(user1, "activation");
    await sender.send(user2, "activation");

    const results = await User.find({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(results.length, 2);
    assert.ok(results[0].emails[0]);
    assert.ok(results[1].emails[0]);
  });

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const user = await insertUser({ email: "test@apprentissage.beta.gouv.fr" });
    const sender = createFakeSender({ fail: true });

    try {
      await sender.send(user, "activation");
      assert.fail();
    } catch (e) {
      const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
      assert.strictEqual(found.emails.length, 1);
      assert.deepStrictEqual(found.emails[0].error, {
        type: "fatal",
        message: "Unable to send email",
      });
    }
  });

  it("Vérifie qu'on efface l'erreur lors d'un renvoi", async () => {
    const { sender } = createTestContext();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      username: "0648248W",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    await sender.resend("TOKEN1");

    const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.ok(!found.emails[0].error);
  });
});
