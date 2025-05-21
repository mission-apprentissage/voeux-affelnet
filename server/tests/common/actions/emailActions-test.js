const assert = require("assert");
const { insertUser, insertEtablissement, insertAdmin } = require("../../utils/fakeData");
const { createFakeMailer } = require("../../utils/fakeMailer");
const { User } = require("../../../src/common/model");
const createEmailActions = require("../../../src/common/actions/createEmailActions");
const { createTestContext } = require("../../utils/testUtils");

describe("emails", () => {
  it("Vérifie qu'on peut envoyer un email", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    const user = await insertAdmin({ email: "test@apprentissage.beta.gouv.fr", username: "test" });

    await sendEmail(user, "activation_admin");

    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "candidats-apprentissage@education.gouv.fr");
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
    assert.strictEqual(found.emails[0].templateName, "activation_admin");
  });

  it("Vérifie qu'on peut renvoyer un email", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertAdmin({
      email: "test@apprentissage.beta.gouv.fr",
      username: "test",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation_admin",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
        },
      ],
    });

    await resendEmail("TOKEN1");

    const emailsSent = getEmailsSent();
    assert.strictEqual(emailsSent.length, 1);
    assert.strictEqual(emailsSent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(emailsSent[0].from, "candidats-apprentissage@education.gouv.fr");
    assert.strictEqual(
      emailsSent[0].subject,
      "[Rappel] Diffusion des listes de candidats Affelnet : activation de votre compte administrateur"
      // "Diffusion des listes de candidats Affelnet : activation de votre compte administrateur"
    );
    const found = await User.findOne().lean();
    assert.strictEqual(found.emails.length, 1);
    assert.strictEqual(found.emails[0].sendDates.length, 2);
  });

  it("Vérifie qu'on envoie un email pour chaque cfa ayant la même adresse email", async () => {
    const { sendEmail } = createTestContext();
    const user1 = await insertEtablissement({ email: "test@apprentissage.beta.gouv.fr", username: "11111111100006" });
    const user2 = await insertEtablissement({ email: "test@apprentissage.beta.gouv.fr", username: "22222222200006" });

    await sendEmail(user1, "activation_responsable");
    await sendEmail(user2, "activation_responsable");

    const results = await User.find({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(results.length, 2);
    assert.ok(results[0].emails[0]);
    assert.ok(results[1].emails[0]);
  });

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const user = await insertUser({ email: "test@apprentissage.beta.gouv.fr" });
    const { sendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });

    try {
      await sendEmail(user, "activation_admin");
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
    const user = await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      username: "0648248W",
      emails: [
        {
          token: "TOKEN1",
          templateName: "activation_admin",
          to: "test@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    const previous = user.emails[0];

    await resendEmail("TOKEN1", { retry: !!previous?.error });

    const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.strictEqual(found.emails.length, 1);
    assert.ok(!found.emails[0].error);
  });
});
