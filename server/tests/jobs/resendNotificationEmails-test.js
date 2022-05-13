const assert = require("assert");
const { DateTime } = require("luxon");
const { insertCfa } = require("../utils/fakeData");
const resendNotificationEmails = require("../../src/jobs/resendNotificationEmails");
const { createTestContext } = require("../utils/testUtils");

describe("resendNotificationEmails", () => {
  it("Vérifie qu'on envoie une relance au bout de 7 jours si le fichier n'a pas été téléchargé", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertCfa({
      username: "0751234J",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: eightDaysAgo }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: twoWeeksAgo,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [eightDaysAgo],
        },
      ],
    });

    const stats = await resendNotificationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on envoie une relance au bout de 7 jours si l'un des fichiers n'a pas été téléchargé", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertCfa({
      username: "0751234J",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [
        { uai: "0751234J", voeux_date: today },
        { uai: "0751234X", voeux_date: twoWeeksAgo },
      ],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: eightDaysAgo,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [eightDaysAgo],
        },
      ],
    });

    const stats = await resendNotificationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas de relance si le fichier a déjà été téléchargé", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: eightDaysAgo }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: today,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [eightDaysAgo],
        },
      ],
    });

    const stats = await resendNotificationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on relance 3 fois maximum", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertCfa({
      username: "0751234J",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: eightDaysAgo }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: twoWeeksAgo,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [twoWeeksAgo, twoWeeksAgo, eightDaysAgo],
        },
      ],
    });

    await resendNotificationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on peut limiter les envois", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertCfa({
      username: "1234568X",
      email: "test1@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: twoWeeksAgo,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [eightDaysAgo],
        },
      ],
    });
    await insertCfa({
      username: "1234568Y",
      email: "test1@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: twoWeeksAgo,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [eightDaysAgo],
        },
      ],
    });

    const stats = await resendNotificationEmails(resendEmail, { limit: 1 });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut renvoyer un email en erreur (retry)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertCfa({
      username: "0751234J",
      email: "test1@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: twoWeeksAgo,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [yesterday],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });

    const stats = await resendNotificationEmails(resendEmail, { retry: true });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "De nouveaux voeux Affelnet sont téléchargeables");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
