const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const sendConfirmationEmails = require("../../src/jobs/sendConfirmationEmails");
const { createTestContext } = require("../utils/testUtils");
const emailActions = require("../../src/common/actions/emailActions");
const { createFakeMailer } = require("../utils/fakeMailer");
const { User } = require("../../src/common/model");

describe("sendConfirmationEmails", () => {
  it("Vérifie qu'on peut envoyer des emails de confirmation", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertCfa({ username: "11111111100006", email: "test@apprentissage.beta.gouv.fr" });
    await insertCfa({
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "other",
          sendDates: [new Date()],
        },
      ],
    });

    const stats = await sendConfirmationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 2);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[1].to, "test1@apprentissage.beta.gouv.fr");
    assert.ok(sent[1].html.indexOf("Madame, Monsieur,") !== -1);
    assert.strictEqual(
      sent[0].subject,
      "Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : 11111111100006)"
    );
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 2,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà contactés pour ce template", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [new Date()],
        },
      ],
    });

    const stats = await sendConfirmationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs qui se sont désinscrits", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      unsubscribe: true,
    });

    const stats = await sendConfirmationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { sendEmail } = emailActions({ mailer: createFakeMailer({ fail: true }) });
    await insertCfa({ username: "11111111100006", email: "test@apprentissage.beta.gouv.fr" });
    await insertCfa({
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "other",
          sendDates: [new Date()],
        },
      ],
    });

    try {
      await sendConfirmationEmails(sendEmail);
      assert.fail();
    } catch (e) {
      const found = await User.findOne({ email: "test1@apprentissage.beta.gouv.fr" }).lean();
      const confirmation = found.emails.find((e) => e.templateName === "confirmation");
      assert.ok(confirmation);
      assert.deepStrictEqual(confirmation.error, {
        type: "fatal",
        message: "Unable to send email",
      });
    }
  });
});
