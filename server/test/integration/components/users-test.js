const assert = require("assert");
const integrationTests = require("../utils/integrationTests");
const { insertUser } = require("../utils/fakeData");
const { activate, changePassword, unsubscribe, removeUser } = require("../../../src/common/users");
const { User } = require("../../../src/common/model");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut activer un utilisateur", async () => {
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    await activate("user1", "password");

    const found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "activé");
  });

  it("Vérifie qu'on rejete un utilisateur invalide", async () => {
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    try {
      await activate("INVALID", "password");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Utilisateur INVALID inconnu");
    }
  });

  it("Vérifie qu'on peut supprimer un utilisateur", async () => {
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      isAdmin: true,
    });

    await removeUser("user1");

    const count = await User.countDocuments();
    assert.strictEqual(count, 0);
  });

  it("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    await insertUser({
      username: "user",
      email: "user@apprentissage.beta.gouv.fr",
    });

    const user = await activate("user", "Password!123456");
    await changePassword("user", "password");

    const found = await User.findOne({ username: "user" });
    assert.ok(found.password !== user.password);
  });

  it("Vérifie qu'on peut désinscrire un utilisateur avec son username", async () => {
    await insertUser({
      username: "user1",
      unsubscribe: false,
    });

    await unsubscribe("user1");

    const found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.unsubscribe, true);
  });

  it("Vérifie qu'on peut désinscrire un utilisateur avec un token d'email", async () => {
    await insertUser({
      unsubscribe: false,
      emails: [
        {
          token: "TOKEN",
          templateName: "other",
          to: "test1@apprentissage.beta.gouv.fr",
          sendDates: [new Date()],
        },
      ],
    });

    await unsubscribe("TOKEN");

    const found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.unsubscribe, true);
  });
});
