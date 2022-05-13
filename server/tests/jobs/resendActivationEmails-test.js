const assert = require("assert");
const { insertUser, insertCfa } = require("../utils/fakeData");
const resendActivationEmails = require("../../src/jobs/resendActivationEmails");
const { DateTime } = require("luxon");
const { createTestContext } = require("../utils/testUtils");

describe("resendActivationEmails", () => {
  it("Vérifie qu'on envoie une relance 3 jours après l'envoi initial", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({ email: "test0@apprentissage.beta.gouv.fr", statut: "confirmé" });
    await insertUser({
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate()],
        },
      ],
    });
    await insertUser({
      statut: "confirmé",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [DateTime.now().minus({ days: 2 }).toJSDate()],
        },
      ],
    });

    const stats = await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'on envoie une relance 3 jours après l'envoi initial pour un CFA", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_cfa",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate()],
        },
      ],
    });

    await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.deepStrictEqual(sent[0].subject, "[Rappel] Des voeux Affelnet sont téléchargeables");
  });

  it("Vérifie qu'on attend 3 jours avant de relancer une deuxième fois", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({ email: "test0@apprentissage.beta.gouv.fr", statut: "confirmé" });
    await insertUser({
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate(), DateTime.now().minus({ days: 1 }).toJSDate()],
        },
      ],
    });

    await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on attend 3 jours avant de relancer une deuxième fois (CFA)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_cfa",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate(), DateTime.now().minus({ days: 1 }).toJSDate()],
        },
      ],
    });

    await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on relance 3 fois maximum", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({ email: "test0@apprentissage.beta.gouv.fr", statut: "confirmé" });
    await insertUser({
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [
            DateTime.now().minus({ days: 10 }).toJSDate(),
            DateTime.now().minus({ days: 9 }).toJSDate(),
            DateTime.now().minus({ days: 8 }).toJSDate(),
          ],
        },
      ],
    });

    await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on relance 3 fois maximum (CFA)", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      email: "test@apprentissage.beta.gouv.fr",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_cfa",
          sendDates: [
            DateTime.now().minus({ days: 10 }).toJSDate(),
            DateTime.now().minus({ days: 9 }).toJSDate(),
            DateTime.now().minus({ days: 8 }).toJSDate(),
          ],
        },
      ],
    });

    await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on peut modifier le nombre de relance maximal", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      username: "0751234J",
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [
            DateTime.now().minus({ days: 10 }).toJSDate(),
            DateTime.now().minus({ days: 9 }).toJSDate(),
            DateTime.now().minus({ days: 8 }).toJSDate(),
          ],
        },
      ],
    });

    await resendActivationEmails(resendEmail, { max: 4 });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
  });

  it("Vérifie qu'on peut renvoyer une email en erreur fatale", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      statut: "confirmé",
      email: "test_fatal@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [new Date()],
          error: {
            type: "fatal",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });
    await insertUser({
      statut: "confirmé",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [new Date()],
          error: {
            type: "hard_bounce",
          },
        },
      ],
    });
    await resendActivationEmails(resendEmail, { retry: true });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test_fatal@apprentissage.beta.gouv.fr");
  });

  it("Vérifie qu'on envoie pas d'emails aux utilisateurs activé ou désinscrits", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      statut: "activé",
      email: "test_activé@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate()],
        },
      ],
    });
    await insertUser({
      statut: "confirmé",
      unsubscribe: true,
      email: "test_confirmé@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate()],
        },
      ],
    });

    await resendActivationEmails(resendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on peut forcer le renvoi d'un email pour un utilisateur", async () => {
    const { resendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      username: "user1",
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [DateTime.now().minus({ days: 4 }).toJSDate()],
          error: {
            type: "soft_bounce",
            message: "Impossible d'envoyer l'email",
          },
        },
      ],
    });
    await resendActivationEmails(resendEmail, { username: "user1" });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
  });
});
