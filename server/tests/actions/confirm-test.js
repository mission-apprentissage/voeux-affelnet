const assert = require("assert");
const { insertCfa } = require("../utils/fakeData");
const { Cfa } = require("../../src/common/model");
const { confirm } = require("../../src/common/actions/confirm");

describe("confirm", () => {
  it("Vérifie qu'on peut confirmer un cfa", async () => {
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    await confirm("11111111100006", "11111111100006@apprentissage.beta.gouv.fr");
    const found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });

  it("Vérifie qu'on peut confirmer un cfa avec une nouvelle adresse email", async () => {
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    await confirm("11111111100006", "user2@apprentissage.beta.gouv.fr");

    const found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
    assert.strictEqual(found.email, "user2@apprentissage.beta.gouv.fr");
  });

  it("Vérifie qu'on ne peut pas confirmer un cfa sans une adresse email", async () => {
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
    });

    try {
      await confirm("11111111100006");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Une confirmation a déjà été enregistrée pour le cfa 11111111100006");
      const found = await Cfa.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, "11111111100006@apprentissage.beta.gouv.fr");
    }
  });

  it("Vérifie qu'on ne peut pas confirmer un cfa déjà confirmé", async () => {
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    try {
      await confirm("11111111100006", "user2@apprentissage.beta.gouv.fr");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Une confirmation a déjà été enregistrée pour le cfa 11111111100006");
      const found = await Cfa.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, "11111111100006@apprentissage.beta.gouv.fr");
    }
  });

  it("Vérifie qu'on peut forcer la confirmation", async () => {
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    await confirm("11111111100006", "user2@apprentissage.beta.gouv.fr", { force: true });

    const found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });
});
