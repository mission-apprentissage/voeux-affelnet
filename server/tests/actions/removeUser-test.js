const assert = require("assert");
const { insertUser } = require("../utils/fakeData");
const { User } = require("../../src/common/model");
const { removeUser } = require("../../src/common/actions/removeUser");

describe("removeUser", () => {
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
});
