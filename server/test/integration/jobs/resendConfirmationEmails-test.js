const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const integrationTests = require("../utils/integrationTests");
const { DateTime } = require("luxon");
const resendConfirmationEmails = require("../../../src/jobs/resendConfirmationEmails");

integrationTests(__filename, (context) => {
  it.only("Vérifie qu'on envoie une relance 7 jours après le premier envoi", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "11111111100006",
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

    let stats = await resendConfirmationEmails(emails);

    let sent = getEmailsSent();
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

  it.only("Vérifie qu'on envoie une relance spécifique quand le cfa a des voeux", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "11111111100006",
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

    let stats = await resendConfirmationEmails(emails);

    let sent = getEmailsSent();
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
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
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

    let stats = await resendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on attend avant 7 jours avant d'envoyer une nouvelle relance", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation",
          sendDates: [DateTime.now().minus({ days: 10 }).toJSDate(), DateTime.now().minus({ days: 3 }).toJSDate()],
        },
      ],
    });

    let stats = await resendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on relance 3 fois maximum par défaut", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
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

    await resendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on peut modifier le nombre de relance maximal", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
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

    await resendConfirmationEmails(emails, { max: 4 });

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
  });

  it("Vérifie qu'on n'envoie pas d'email pour les cfas confirmés ou désinscrits", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      statut: "confirmé",
    });
    await insertCfa({
      unsubscribe: true,
    });

    await resendConfirmationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on peut renvoyer un email en erreur (retry)", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
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

    let stats = await resendConfirmationEmails(emails, { retry: true });

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      "Demande d'informations concernant la communication des voeux exprimés en apprentissage" +
        " via Affelnet pour l'UAI 0751234J"
    );
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on ne renvoie pas un email en erreur autre que de type 'fatal' (retry)", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
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

    let stats = await resendConfirmationEmails(emails, { retry: true });

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
    assert.deepStrictEqual(stats, {
      total: 0,
      sent: 0,
      failed: 0,
    });
  });

  it("Vérifie qu'on peut forcer le renvoi d'un email pour un CFA", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "0751234J",
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

    let stats = await resendConfirmationEmails(emails, { uai: "0751234J" });

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
