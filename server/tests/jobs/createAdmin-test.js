const { omit } = require("lodash");
const assert = require("assert");
const { createAdmin } = require("../../src/jobs/createAdmin.js");
const { User } = require("../../src/common/model");

describe("createAdmin", () => {
  it.skip("Vérifie qu'on peut créer un admin", async () => {
    await createAdmin("admin", "admin@beta.gouv.fr");

    const found = await User.findOne({ username: "admin" }).lean();
    assert.deepStrictEqual(omit(found, ["_id", "__v"]), {
      username: "admin",
      isAdmin: true,
      statut: "confirmé",
      email: "admin@beta.gouv.fr",
      emails: [],
      anciens_emails: [],
      unsubscribe: false,
    });
  });
});
