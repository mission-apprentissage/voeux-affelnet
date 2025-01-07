const assert = require("assert");
const { insertUser } = require("../../utils/fakeData");
const { User } = require("../../../src/common/model");
const { activateUser } = require("../../../src/common/actions/activateUser");
const { changePassword } = require("../../../src/common/actions/changePassword");

describe("changePassword", () => {
  it.skip("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    await insertUser({
      username: "user",
      email: "user@apprentissage.beta.gouv.fr",
    });

    await activateUser("user", "Password!123456");
    const before = await User.findOne({ username: "user" }).select({ password: 1 });

    await changePassword("user", "password");
    const after = await User.findOne({ username: "user" }).select({ password: 1 });

    assert.ok(after.password !== before.password);
  });
});
