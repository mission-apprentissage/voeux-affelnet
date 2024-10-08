const assert = require("assert");
const { DateTime } = require("luxon");
const { insertResponsable } = require("../utils/fakeData");
const resendNotificationEmails = require("../../src/jobs/resendNotificationEmails");
const { createTestContext } = require("../utils/testUtils");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { createFakeMailer } = require("../utils/fakeMailer");
const { User } = require("../../src/common/model");

describe("resendNotificationEmails", () => {
  xit("Vérifie qu'on envoie une relance au bout de 7 jours si le fichier n'a pas été téléchargé", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
      username: "11111111100006",
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

  xit("Vérifie qu'on envoie une relance au bout de 7 jours si l'un des fichiers n'a pas été téléchargé", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
      username: "11111111100006",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [
        { uai: "0751234J", voeux_date: today },
        { uai: "0757890U", voeux_date: twoWeeksAgo },
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

  xit("Vérifie qu'on n'envoie pas de relance si le fichier a déjà été téléchargé", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    await insertResponsable({
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

  xit("Vérifie qu'on relance 3 fois maximum", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
      username: "11111111100006",
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

  xit("Vérifie qu'on peut limiter les envois", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
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
    await insertResponsable({
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

  xit("Vérifie qu'on peut renvoyer un email en erreur (retry)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
      username: "11111111100006",
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
    assert.deepStrictEqual(sent[0].subject, "De nouveaux vœux Affelnet sont téléchargeables");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  xit("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { resendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
      username: "11111111100006",
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

    try {
      await resendNotificationEmails(resendEmail);
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

  xit("Vérifie qu'on peut renvoyer un email à un CFA", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    const eightDaysAgo = DateTime.now().minus({ days: 8 }).toJSDate();
    const twoWeeksAgo = DateTime.now().minus({ days: 15 }).toJSDate();
    await insertResponsable({
      username: "11111111100006",
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
    await insertResponsable({
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

    const stats = await resendNotificationEmails(resendEmail, { username: "11111111100006" });

    const sent = getEmailsSent();
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
