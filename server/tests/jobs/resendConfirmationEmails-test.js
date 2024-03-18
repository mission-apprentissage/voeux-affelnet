const assert = require("assert");
const { insertGestionnaire } = require("../utils/fakeData");
const { DateTime } = require("luxon");
const resendConfirmationEmails = require("../../src/jobs/resendConfirmationEmails");
const { createTestContext } = require("../utils/testUtils");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { createFakeMailer } = require("../utils/fakeMailer");
const { User } = require("../../src/common/model");

describe("resendConfirmationEmails", () => {
  xit("Vérifie qu'on envoie une relance 3 jours après le premier envoi", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      siret: "11111111100006",
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate()],
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "candidats-apprentissage@education.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      // "[Rappel] Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : 11111111100006)"
      "Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : 11111111100006)"
    );
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  xit("Vérifie qu'on ne renvoie pas d'email en erreur", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      siret: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 3 }).toJSDate()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  xit("Vérifie qu'on attend avant 3 jours avant d'envoyer une nouvelle relance", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate(), DateTime.now().minus({ days: 2 }).toJSDate()],
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  xit("Vérifie qu'on relance 3 fois maximum par défaut", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [
            DateTime.now().minus({ days: 20 }).toJSDate(),
            DateTime.now().minus({ days: 15 }).toJSDate(),
            DateTime.now().minus({ days: 10 }).toJSDate(),
          ],
        },
      ],
    });

    await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  xit("Vérifie qu'on peut modifier le nombre de relance maximal", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [
            DateTime.now().minus({ days: 20 }).toJSDate(),
            DateTime.now().minus({ days: 15 }).toJSDate(),
            DateTime.now().minus({ days: 10 }).toJSDate(),
          ],
        },
      ],
    });

    await resendConfirmationEmails(resendEmail, { max: 4 });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
  });

  xit("Vérifie qu'on n'envoie pas d'email pour les CFA confirmés ou désinscrits", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      statut: "confirmé",
    });
    await insertGestionnaire({
      unsubscribe: true,
    });

    await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  xit("Vérifie qu'on peut renvoyer un email en erreur (retry)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 3 }).toJSDate()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail, { retry: true });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      "Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : 11111111100006)"
    );
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  xit("Vérifie qu'on ne renvoie pas un email en erreur autre que de type 'fatal' (retry)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 3 }).toJSDate()],
          error: {
            type: "hard_bounce",
          },
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail, { retry: true });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  xit("Vérifie qu'on peut renvoyer un email à un CFA", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 8 }).toJSDate()],
        },
      ],
    });
    await insertGestionnaire({
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 8 }).toJSDate()],
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail, { username: "11111111100006" });

    const sent = getEmailsSent();
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  xit("Vérifie qu'on peut renvoyer un email à un CFA sans tenir compte de la dernière relance", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 1 }).toJSDate()],
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail, { username: "11111111100006" });

    const sent = getEmailsSent();
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  xit("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { resendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });
    await insertGestionnaire({
      siret: "11111111100006",
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 8 }).toJSDate()],
        },
      ],
    });

    try {
      await resendConfirmationEmails(resendEmail);
      assert.fail();
    } catch (e) {
      const found = await User.findOne({ email: "test1@apprentissage.beta.gouv.fr" }).lean();
      assert.strictEqual(found.emails.length, 1);
      assert.deepStrictEqual(found.emails[0].error, {
        type: "fatal",
        message: "Unable to send email",
      });
    }
  });
});
