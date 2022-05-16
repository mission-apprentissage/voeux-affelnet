const assert = require("assert");
const { insertUser } = require("../../utils/fakeData");
const { User } = require("../../../src/common/model");
const { activateUser } = require("../../../src/common/actions/activateUser");
const { changePassword } = require("../../../src/common/actions/changePassword");

describe("changePassword", () => {
  it("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    await insertUser({
      username: "user",
      email: "user@apprentissage.beta.gouv.fr",
    });

    const user = await activateUser("user", "Password!123456");
    await changePassword("user", "password");

    const found = await User.findOne({ username: "user" });
    assert.ok(found.password !== user.password);
  });
});
