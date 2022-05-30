const assert = require("assert");
const { DateTime } = require("luxon");
const { insertCfa } = require("../utils/fakeData");
const sendNotificationEmails = require("../../src/jobs/sendNotificationEmails");
const { createTestContext } = require("../utils/testUtils");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { createFakeMailer } = require("../utils/fakeMailer");
const { User } = require("../../src/common/model");

describe("sendNotificationEmails", () => {
  it("Vérifie qu'on envoie un email de notifications quand il y a de nouveaux vœux", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
    await insertCfa({
      username: "11111111100006",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: lastWeek,
        },
      ],
    });

    const stats = await sendNotificationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "De nouveaux vœux Affelnet sont téléchargeables");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas de notification si l'email a déjà été envoyé", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: lastWeek,
        },
      ],
      emails: [
        {
          token: "TOKEN",
          templateName: "notification",
          sendDates: [lastWeek],
        },
      ],
    });

    const stats = await sendNotificationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut limiter les envois", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
    await insertCfa({
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: lastWeek,
        },
      ],
    });
    await insertCfa({
      statut: "activé",
      etablissements: [{ uai: "0757890U", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0757890U",
          date: lastWeek,
        },
      ],
    });

    const stats = await sendNotificationEmails(sendEmail, { limit: 1 });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { sendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });
    const today = new Date();
    const lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
    await insertCfa({
      username: "11111111100006",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: lastWeek,
        },
      ],
    });

    try {
      await sendNotificationEmails(sendEmail);
      assert.fail();
    } catch (e) {
      const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
      const notification = found.emails.find((e) => e.templateName === "notification");
      assert.ok(notification);
      assert.deepStrictEqual(notification.error, {
        type: "fatal",
        message: "Unable to send email",
      });
    }
  });

  it("Vérifie qu'on peut renvoyer un email à un CFA", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    const today = new Date();
    const lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
    await insertCfa({
      username: "11111111100006",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: lastWeek,
        },
      ],
    });
    await insertCfa({
      statut: "activé",
      etablissements: [{ uai: "0751234J", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234J",
          date: lastWeek,
        },
      ],
    });

    const stats = await sendNotificationEmails(sendEmail, { username: "11111111100006" });

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
