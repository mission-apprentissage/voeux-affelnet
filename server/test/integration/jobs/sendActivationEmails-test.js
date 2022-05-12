const assert = require("assert");
const { Cfa, User } = require("../../../src/common/model");
const { insertUser, insertCfa } = require("../utils/fakeData");
const integrationTests = require("../utils/integrationTests");
const sendActivationEmails = require("../../../src/jobs/sendActivationEmails");

integrationTests(__filename, (context) => {
  it("Vérifie qu'on envoie des emails d'activation uniquement aux utilisateurs confirmés", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertUser({ email: "test@apprentissage.beta.gouv.fr", statut: "confirmé" });
    await insertUser({
      statut: "confirmé",
      email: "test1@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "other",
          sendDates: [new Date()],
        },
      ],
    });

    let stats = await sendActivationEmails(emails);

    let found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.deepStrictEqual(found.emails[0].templateName, "activation");
    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 2);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "voeux-affelnet@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[1].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "Activation de votre compte");
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 2,
      failed: 0,
    });
  });

  it("Vérifie qu'on envoie des emails d'activation uniquement aux CFA confirmés", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      email: "test@apprentissage.beta.gouv.fr",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
    });

    await sendActivationEmails(emails);

    let found = await Cfa.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.deepStrictEqual(found.emails[0].templateName, "activation_cfa");
    let sent = getEmailsSent();
    assert.deepStrictEqual(sent[0].subject, "Des voeux Affelnet sont téléchargeables");
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà activé", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertUser({
      username: "123457X",
      password: "12345",
    });

    await sendActivationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs qui se sont désinscrits", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertUser({
      username: "123457X",
      statut: "confirmé",
      unsubscribe: true,
    });

    await sendActivationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà contactés pour ce template", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertUser({
      username: "123457X",
      statut: "confirmé",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation",
          sendDates: [new Date()],
        },
      ],
    });

    await sendActivationEmails(emails);

    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  it("Vérifie qu'on n'envoie pas d'emails aux cfas n'ayant pas de voeux", async () => {
    let { emails } = context.getComponents();
    let { getEmailsSent } = context.getHelpers();
    await insertCfa({
      username: "11111111100006",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
    });
    await insertCfa({ username: "22222222200006", statut: "confirmé" });

    let stats = await sendActivationEmails(emails);

    let found = await Cfa.findOne({ siret: "11111111100006" }).lean();
    assert.strictEqual(found.emails.length, 1);
    found = await Cfa.findOne({ siret: "22222222200006" }).lean();
    assert.deepStrictEqual(found.emails, []);
    let sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
