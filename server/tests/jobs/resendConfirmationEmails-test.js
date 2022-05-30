const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const { DateTime } = require("luxon");
const resendConfirmationEmails = require("../../src/jobs/resendConfirmationEmails");
const { createTestContext } = require("../utils/testUtils");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { createFakeMailer } = require("../utils/fakeMailer");
const { User } = require("../../src/common/model");

describe("resendConfirmationEmails", () => {
  it("Vérifie qu'on envoie une relance 7 jours après le premier envoi", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

    const stats = await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      "[Rappel] Affelnet apprentissage – Information requise pour la transmission des vœux 2022 (Siret : 11111111100006)"
    );
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on ne renvoie pas d'email en erreur", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

  it("Vérifie qu'on attend avant 7 jours avant d'envoyer une nouvelle relance", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 10 }).toJSDate(), DateTime.now().minus({ days: 3 }).toJSDate()],
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

  it("Vérifie qu'on relance 3 fois maximum par défaut", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

  it("Vérifie qu'on peut modifier le nombre de relance maximal", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

  it("Vérifie qu'on n'envoie pas d'email pour les CFA confirmés ou désinscrits", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      statut: "confirmé",
    });
    await insertCfa({
      unsubscribe: true,
    });

    await resendConfirmationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on peut renvoyer un email en erreur (retry)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

  it("Vérifie qu'on ne renvoie pas un email en erreur autre que de type 'fatal' (retry)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

  it("Vérifie qu'on peut renvoyer un email à un CFA", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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
    await insertCfa({
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

  it("Vérifie qu'on peut renvoyer un email à un CFA sans tenir compte de la dernière relance", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
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

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { resendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });
    await insertCfa({
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
