const assert = require("assert");
const { Gestionnaire, User } = require("../../src/common/model");
const { insertUser, insertGestionnaire } = require("../utils/fakeData");
const sendActivationEmails = require("../../src/jobs/sendActivationEmails");
const { createTestContext } = require("../utils/testUtils");
const createEmailActions = require("../../src/common/actions/createEmailActions");
const { createFakeMailer } = require("../utils/fakeMailer");

describe("sendActivationEmails", () => {
  xit("Vérifie qu'on envoie des emails d'activation uniquement aux utilisateurs confirmés", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
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

    const stats = await sendActivationEmails(sendEmail);

    const found = await User.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.deepStrictEqual(found.emails[0].templateName, "activation_user");
    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 2);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].replyTo, "candidats-apprentissage@education.gouv.fr");
    assert.deepStrictEqual(sent[1].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(sent[0].subject, "Activation de votre compte");
    assert.deepStrictEqual(stats, {
      total: 2,
      sent: 2,
      failed: 0,
    });
  });

  xit("Vérifie qu'on envoie des emails d'activation uniquement aux CFA confirmés", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      siret: "11111111100006",
      email: "test@apprentissage.beta.gouv.fr",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
    });

    await sendActivationEmails(sendEmail);

    const found = await Gestionnaire.findOne({ email: "test@apprentissage.beta.gouv.fr" }).lean();
    assert.deepStrictEqual(found.emails[0].templateName, "activation_cfa");
    const sent = getEmailsSent();
    assert.deepStrictEqual(sent[0].subject, "Des vœux Affelnet sont téléchargeables (Siret : 11111111100006)");
  });

  xit("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà activé", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      username: "123457X",
      password: "12345",
    });

    await sendActivationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  xit("Vérifie qu'on n'envoie pas d'emails aux utilisateurs qui se sont désinscrits", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      username: "123457X",
      statut: "confirmé",
      unsubscribe: true,
    });

    await sendActivationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  xit("Vérifie qu'on n'envoie pas d'emails aux utilisateurs déjà contactés pour ce template", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertUser({
      username: "123457X",
      statut: "confirmé",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_user",
          sendDates: [new Date()],
        },
      ],
    });

    await sendActivationEmails(sendEmail);

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 0);
  });

  xit("Vérifie qu'on n'envoie pas d'emails aux cfas n'ayant pas de vœux", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertGestionnaire({
      username: "11111111100006",
      statut: "confirmé",
      etablissements: [{ uai: "0751234J", voeux_date: new Date() }],
    });
    await insertGestionnaire({ username: "22222222200006", statut: "confirmé" });

    const stats = await sendActivationEmails(sendEmail);

    let found = await Gestionnaire.findOne({ siret: "11111111100006" }).lean();
    assert.strictEqual(found.emails.length, 1);
    found = await Gestionnaire.findOne({ siret: "22222222200006" }).lean();
    assert.deepStrictEqual(found.emails, []);
    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  xit("Vérifie qu'on gère une erreur lors de l'envoi d'un email", async () => {
    const { sendEmail } = createEmailActions({ mailer: createFakeMailer({ fail: true }) });
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

    try {
      await sendActivationEmails(sendEmail);
      assert.fail();
    } catch (e) {
      const found = await User.findOne({ email: "test1@apprentissage.beta.gouv.fr" }).lean();
      const activation = found.emails.find((e) => e.templateName === "activation_user");
      assert.ok(activation);
      assert.deepStrictEqual(activation.error, {
        type: "fatal",
        message: "Unable to send email",
      });
    }
  });

  xit("Vérifie qu'on peut envoyer l'email a un CFA", async () => {
    const { sendEmail, getEmailsSent } = createTestContext();
    await insertUser({ username: "user1", email: "test@apprentissage.beta.gouv.fr", statut: "confirmé" });
    await insertUser({ statut: "confirmé" });

    const stats = await sendActivationEmails(sendEmail, { username: "user1" });

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(stats, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });
});
