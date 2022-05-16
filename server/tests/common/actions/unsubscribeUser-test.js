const assert = require("assert");
const { insertUser } = require("../../utils/fakeData");
const { User } = require("../../../src/common/model");
const { unsubscribeUser } = require("../../../src/common/actions/unsubscribeUser");

describe("unsubscribeUser", () => {
  it("Vérifie qu'on peut désinscrire un utilisateur avec son username", async () => {
    await insertUser({
      username: "user1",
      unsubscribe: false,
    });

    await unsubscribeUser("user1");

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

    await unsubscribeUser("TOKEN");

    const found = await User.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.unsubscribe, true);
  });
});
