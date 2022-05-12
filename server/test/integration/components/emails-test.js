const assert = require("assert");
const integrationTests = require("../utils/integrationTests");
const { insertUser, insertCfa } = require("../utils/fakeData");
const createEmails = require("../../../src/common/emails");
const fakeMailer = require("../utils/fakeMailer");
const { User } = require("../../../src/common/model");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut envoyer un email", async () => {
    let emailsSent = [];
    let emails = await createEmails(fakeMailer({ calls: emailsSent }));
    let user = await insertUser({ email: "test@apprentissage.beta.gouv.fr", username: "0648248W" });

    await emails.send(user, "activation");

    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "Activation de votre compte");
    let found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 1);
    assert.strictEqual(found.emails[0].messageIds.length, 1);
    assert.ok(found.emails[0].token);
    assert.strictEqual(found.emails[0].templateName, "activation");
  });

  it("Vérifie qu'on peut renvoyer un email", async () => {
    let emailsSent = [];
    let emails = await createEmails(fakeMailer({ calls: emailsSent }));
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

    await emails.resend("TOKEN1");

    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].subject, "[Rappel] Activation de votre compte");
    let found = await User.findOne().lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 2);
  });

  it("Vérifie qu'on envoie un email pour chaque cfa ayant la même adresse email", async () => {
    let emailsSent = [];
    let user1 = await insertCfa({ email: "test@apprentissage.beta.gouv.fr", username: "11111111100006" });
    let user2 = await insertCfa({ email: "test@apprentissage.beta.gouv.fr", username: "22222222200006" });
    let emails = await createEmails(fakeMailer({ calls: emailsSent }));

    await emails.send(user1, "activation");
    await emails.send(user2, "activation");

    let results = await User.find({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(results.length, 2);
    assert.ok(results[0].emails[0]);
    assert.ok(results[1].emails[0]);
  });

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    let user = await insertUser({ email: "test@apprentissage.beta.gouv.fr" });
    let emails = await createEmails(fakeMailer({ fail: true }));

    try {
      await emails.send(user, "activation");
      assert.fail();
    } catch (e) {
      let found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
      assert.strictEqual(found.emails.length, 1);
      assert.deepStrictEqual(found.emails[0].error, {
        type: "fatal",
        message: "Unable to send email",
      });
    }
  });

  it("Vérifie qu'on efface l'erreur lors d'un renvoi", async () => {
    let emailsSent = [];
    let emails = await createEmails(fakeMailer({ calls: emailsSent }));
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

    await emails.resend("TOKEN1");

    let found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.ok(!found.emails[0].error);
  });
});
