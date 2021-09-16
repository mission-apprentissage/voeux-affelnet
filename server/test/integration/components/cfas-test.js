const assert = require("assert");
const integrationTests = require("../utils/integrationTests");
const { insertCfa } = require("../utils/fakeData");
const { Cfa } = require("../../../src/common/model");

integrationTests(__filename, ({ getComponents }) => {
  it("Vérifie qu'on peut confirmer un cfa", async () => {
    let { cfas } = getComponents();
    await insertCfa({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      email_source: "directeur",
    });

    await cfas.confirm("user1", "user1@apprentissage.beta.gouv.fr");

    let found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });

  it("Vérifie qu'on peut confirmer un cfa avec une nouvelle adresse email", async () => {
    let { cfas } = getComponents();
    await insertCfa({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      email_source: "contact",
    });

    await cfas.confirm("user1", "user2@apprentissage.beta.gouv.fr");

    let found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
    assert.strictEqual(found.email, "user2@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(found.contacts, ["user1@apprentissage.beta.gouv.fr"]);
  });

  it("Vérifie qu'on ne peut pas confirmer un cfa sans une adresse email", async () => {
    let { cfas } = getComponents();
    await insertCfa({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      email_source: "contact",
    });

    try {
      await cfas.confirm("user1");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Une confirmation a déjà été enregistrée pour le cfa user1");
      let found = await Cfa.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, "user1@apprentissage.beta.gouv.fr");
      assert.strictEqual(found.email_source, "contact");
    }
  });

  it("Vérifie qu'on ne peut pas confirmer un cfa déjà confirmé", async () => {
    let { cfas } = getComponents();
    await insertCfa({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    try {
      await cfas.confirm("user1", "user2@apprentissage.beta.gouv.fr");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Une confirmation a déjà été enregistrée pour le cfa user1");
      let found = await Cfa.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, "user1@apprentissage.beta.gouv.fr");
    }
  });

  it("Vérifie qu'on peut forcer la confirmation", async () => {
    let { cfas } = getComponents();
    await insertCfa({
      username: "user1",
      email: "user1@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    await cfas.confirm("user1", "user2@apprentissage.beta.gouv.fr", { force: true });

    let found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });
});
