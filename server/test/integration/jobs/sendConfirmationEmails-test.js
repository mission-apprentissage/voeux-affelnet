const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const integrationTests = require("../utils/integrationTests");
const sendConfirmationEmails = require("../../../src/jobs/sendConfirmationEmails");

integrationTests(__filename, (context) => {
  it("Vérifie qu'on peut envoyer des emails de confirmation (contact)", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({ email: "test@apprentissage.beta.gouv.fr" });
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

    let stats = await sendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 2);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[1].to, "test1@apprentissage.beta.gouv.fr");
    assert.ok(sent[1].html.indexOf("Madame, Monsieur,") !== -1);
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 2,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut envoyer des emails de confirmation (directeur)", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({ email: "test@apprentissage.beta.gouv.fr", email_source: "directeur" });

    let stats = await sendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.ok(sent[0].html.indexOf("Madame la directrice, Monsieur le directeur,") !== -1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà contactés pour ce template", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation_contact",
          sendDates: [new Date()],
        },
      ],
    });

    let stats = await sendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs qui se sont désinscrits", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      unsubscribe: true,
    });

    let stats = await sendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });
});
