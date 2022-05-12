const assert = require("assert");
const { DateTime } = require("luxon");
const { insertCfa } = require("../utils/fakeData");
const integrationTests = require("../utils/integrationTests");
const sendNotificationEmails = require("../../../src/jobs/sendNotificationEmails");

integrationTests(__filename, (context) => {
  it("Vérifie qu'on envoie un email de notifications quand il y a de nouveaux voeux", async () => {
    let { sender } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    let today = new Date();
    let lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
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

    let stats = await sendNotificationEmails(sender);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "De nouveaux voeux Affelnet sont téléchargeables");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas de notification si l'email a déjà été envoyé", async () => {
    let { sender } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    let today = new Date();
    let lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
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

    let stats = await sendNotificationEmails(sender);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut limiter les envois", async () => {
    let { sender } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    let today = new Date();
    let lastWeek = DateTime.fromJSDate(today).minus({ days: 7 }).toJSDate();
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
      etablissements: [{ uai: "0751234X", voeux_date: today }],
      voeux_telechargements: [
        {
          uai: "0751234X",
          date: lastWeek,
        },
      ],
    });

    let stats = await sendNotificationEmails(sender, { limit: 1 });

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 1,
      failed: 0,
    });
  });
});
