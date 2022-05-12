const assert = require("assert");
const integrationTests = require("../utils/integrationTests");
const { insertUser } = require("../utils/fakeData");
const users = require("../../../src/common/users");
const { User } = require("../../../src/common/model");

integrationTests(__filename, () => {
  it.only("Vérifie qu'on peut activer un utilisateur", async () => {
    let { activate } = await users();
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    await activate("user1", "password");

    let found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "activé");
  });

  it.only("Vérifie qu'on rejete un utilisateur invalide", async () => {
    let { activate } = await users();
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

  it.only("Vérifie qu'on peut supprimer un utilisateur", async () => {
    let { removeUser } = await users();
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      isAdmin: true,
    });

    await removeUser("user1");

    let count = await User.countDocuments();
    assert.strictEqual(count, 0);
  });

  it.only("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    let { changePassword, activate } = await users();
    await insertUser({
      username: "user",
      email: "user@apprentissage.beta.gouv.fr",
    });

    let user = await activate("user", "Password!123456");
    await changePassword("user", "password");

    let found = await User.findOne({ username: "user" });
    assert.ok(found.password !== user.password);
  });

  it.only("Vérifie qu'on peut désinscrire un utilisateur avec son username", async () => {
    let { unsubscribe } = await users();
    await insertUser({
      username: "user1",
      unsubscribe: false,
    });

    await unsubscribe("user1");

    let found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.unsubscribe, true);
  });

  it.only("Vérifie qu'on peut désinscrire un utilisateur avec un token d'email", async () => {
    let { unsubscribe } = await users();
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

    let found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.unsubscribe, true);
  });
});
