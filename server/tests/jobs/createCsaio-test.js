const { omit } = require("lodash");
const assert = require("assert");
const { Csaio } = require("../../src/common/model/index.js");
const { createCsaio } = require("../../src/jobs/createCsaio.js");

describe("createCsaio", () => {});
it("Vérifie qu'on peut créer un csaio", async () => {
  await createCsaio("csaio", "csaio@beta.gouv.fr", "76");

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
    region: {
      code: "76",
      nom: "Occitanie",
    },
  });
});

it("Vérifie qu'on rejète une région invalide", async () => {
  try {
    await createCsaio("csaio", "csaio@beta.gouv.fr", "-1");
    assert.fail();
  } catch (e) {
    assert.strictEqual(e.message, "Region invalide -1");
  }
});
