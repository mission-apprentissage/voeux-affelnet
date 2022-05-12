const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const integrationTests = require("../utils/integrationTests");
const sendConfirmationEmails = require("../../../src/jobs/sendConfirmationEmails");

integrationTests(__filename, (context) => {
  it("Vérifie qu'on peut envoyer des emails de confirmation", async () => {
    let { sender } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
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

    let stats = await sendConfirmationEmails(sender);

    let sent = getEmailsSent();
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
    let { sender } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
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

    let stats = await sendConfirmationEmails(sender);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs qui se sont désinscrits", async () => {
    let { sender } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      unsubscribe: true,
    });

    let stats = await sendConfirmationEmails(sender);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });
});
