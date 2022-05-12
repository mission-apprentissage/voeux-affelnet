const assert = require("assert");
const { insertUser } = require("../utils/fakeData");
const { User } = require("../../src/common/model");
const { activateUser } = require("../../src/common/actions/activateUser");

describe("activateUser", () => {
  it("Vérifie qu'on peut activer un utilisateur", async () => {
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    await activateUser("user1", "password");

    const found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "activé");
  });

  it("Vérifie qu'on rejete un utilisateur invalide", async () => {
    await insertUser({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
    });

    try {
      await activateUser("INVALID", "password");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Utilisateur INVALID inconnu");
    }
  });
});
