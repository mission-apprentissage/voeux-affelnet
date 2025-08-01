const assert = require("assert");
const { insertResponsable } = require("../utils/fakeData");
const sendConfirmationEmails = require("../../src/jobs/sendConfirmationEmails");
const { createTestContext } = require("../utils/testUtils");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { createFakeMailer } = require("../utils/fakeMailer");
const { User } = require("../../src/common/model");

describe("sendConfirmationEmails", () => {
  xit("Vérifie qu'on peut envoyer des emails de confirmation", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertResponsable({ username: "11111111100006", email: "test@apprentissage.beta.gouv.fr" });
    await insertResponsable({
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
    assert.deepStrictEqual(sent[0].replyTo, "candidats-apprentissage@education.gouv.fr");
    assert.deepStrictEqual(sent[1].to, "test1@apprentissage.beta.gouv.fr");
    assert.ok(sent[1].html.indexOf("Madame, Monsieur,") !== -1);
    assert.strictEqual(
      sent[0].subject,
      "Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : 11111111100006)"
    );
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 2,
      failed: 0,
    });
  });

  xit("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà contactés pour ce template", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertResponsable({
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

  xit("Vérifie qu'on n'envoie pas d'emails aux utilisateurs qui se sont désinscrits", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertResponsable({
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

  xit("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { sendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });
    await insertResponsable({ username: "11111111100006", email: "test@apprentissage.beta.gouv.fr" });
    await insertResponsable({
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

  xit("Vérifie qu'on peut envoyer un email à un CFA", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertResponsable({ username: "11111111100006", email: "test@apprentissage.beta.gouv.fr" });
    await insertResponsable({
      email: "test1@apprentissage.beta.gouv.fr",
    });

    const stats = await sendConfirmationEmails(sendEmail, { username: "11111111100006" });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
