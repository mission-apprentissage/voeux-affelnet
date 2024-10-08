const { omit } = require("lodash");
const assert = require("assert");
const { Csaio } = require("../../src/common/model");
const { createCsaio } = require("../../src/jobs/createCsaio.js");

describe("createCsaio", () => {
  it("Vérifie qu'on peut créer un csaio", async () => {
    await createCsaio("csaio", "csaio@beta.gouv.fr", [{ code: "01", nom: "Paris" }]);

    const found = await Csaio.findOne({ username: "csaio" }).lean();
    assert.deepStrictEqual(omit(found, ["_id", "__v"]), {
      type: "Csaio",
      username: "csaio",
      isAdmin: false,
      statut: "confirmé",
      email: "csaio@beta.gouv.fr",
      emails: [],
      anciens_emails: [],
      unsubscribe: false,
      academies: [{ code: "01", nom: "Paris" }],
    });
  });

  it("Vérifie qu'on rejète une région invalide", async () => {
    try {
      await createCsaio("csaio", "csaio@beta.gouv.fr", [{ code: "-1", nom: "invalid" }]);
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "Académies invalides");
    }
  });
});
