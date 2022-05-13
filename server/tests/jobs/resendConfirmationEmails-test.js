const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const { DateTime } = require("luxon");
const resendConfirmationEmails = require("../../src/jobs/resendConfirmationEmails");
const { createTestContext } = require("../utils/testUtils");

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
      "[Rappel] Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : 11111111100006)"
    );
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on envoie une relance spécifique quand le cfa a des voeux", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      siret: "11111111100006",
      statut: "en attente",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
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
    assert.deepStrictEqual(
      sent[0].subject,
      "[Rappel] Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : 11111111100006)"
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
      "Affelnet apprentissage – Information requise pour la transmission des voeux 2022 (Siret : 11111111100006)"
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

  it("Vérifie qu'on peut forcer le renvoi d'un email pour un CFA", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      username: "11111111100006",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 8 }).toJSDate()],
          error: {
            type: "hard_bounce",
          },
        },
      ],
    });

    const stats = await resendConfirmationEmails(resendEmail, { siret: "11111111100006" });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});