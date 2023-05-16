const assert = require("assert");
const { insertUser, insertGestionnaire } = require("../../utils/fakeData");
const { createFakeMailer } = require("../../utils/fakeMailer");
const { User } = require("../../../src/common/model");
const createEmailActions = require("../../../src/common/actions/createEmailActions");
const { createTestContext } = require("../../utils/testUtils");

describe("emails", () => {
  it("Vérifie qu'on peut envoyer un email", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    const user = await insertUser({ email: "test@apprentissage.beta.gouv.fr", username: "0648248W" });

    await sendEmail(user, "activation_user");

    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(
      emailsSent[0].subject,
      "Diffusion des listes de candidats Affelnet : activation de votre compte administrateur"
    );
    const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 1);
    assert.strictEqual(found.emails[0].sendDates[0].constructor.name, "Date");
    assert.strictEqual(found.emails[0].messageIds.length, 1);
    assert.ok(found.emails[0].messageIds[0].indexOf("-") !== -1);
    assert.ok(found.emails[0].token);
    assert.strictEqual(found.emails[0].templateName, "activation_user");
  });

  it("Vérifie qu'on peut renvoyer un email", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      username: "0648248W",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation_user",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
        },
      ],
    });

    await resendEmail("TOKEN1");

    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.strictEqual(
      emailsSent[0].subject,
      "[Rappel] Diffusion des listes de candidats Affelnet : activation de votre compte administrateur"
    );
    const found = await User.findOne().lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 2);
  });

  it("Vérifie qu'on envoie un email pour chaque cfa ayant la même adresse email", async () => {
    const { sendEmail } = createTestContext();
    const user1 = await insertGestionnaire({ email: "test@apprentissage.beta.gouv.fr", username: "11111111100006" });
    const user2 = await insertGestionnaire({ email: "test@apprentissage.beta.gouv.fr", username: "22222222200006" });

    await sendEmail(user1, "activation_user");
    await sendEmail(user2, "activation_user");

    const results = await User.find({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(results.length, 2);
    assert.ok(results[0].emails[0]);
    assert.ok(results[1].emails[0]);
  });

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const user = await insertUser({ email: "test@apprentissage.beta.gouv.fr" });
    const { sendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });

    try {
      await sendEmail(user, "activation_user");
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
    const { resendEmail } = createTestContext();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      username: "0648248W",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation_user",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    await resendEmail("TOKEN1");

    const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.ok(!found.emails[0].error);
  });
});
