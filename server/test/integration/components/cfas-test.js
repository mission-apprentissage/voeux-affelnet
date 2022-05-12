const assert = require("assert");
const integrationTests = require("../utils/integrationTests");
const { insertCfa } = require("../utils/fakeData");
const { Cfa } = require("../../../src/common/model");

integrationTests(__filename, ({ getComponents }) => {
  it.only("Vérifie qu'on peut confirmer un cfa", async () => {
    const { cfas } = getComponents();
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      email_source: "directeur",
    });

    await cfas.confirm("11111111100006", "11111111100006@apprentissage.beta.gouv.fr");

    const found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });

  it.only("Vérifie qu'on peut confirmer un cfa avec une nouvelle adresse email", async () => {
    const { cfas } = getComponents();
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      email_source: "contact",
    });

    await cfas.confirm("11111111100006", "user2@apprentissage.beta.gouv.fr");

    const found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
    assert.strictEqual(found.email, "user2@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(found.contacts, ["11111111100006@apprentissage.beta.gouv.fr"]);
  });

  it.only("Vérifie qu'on ne peut pas confirmer un cfa sans une adresse email", async () => {
    const { cfas } = getComponents();
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      email_source: "contact",
    });

    try {
      await cfas.confirm("11111111100006");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Une confirmation a déjà été enregistrée pour le cfa 11111111100006");
      const found = await Cfa.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, "11111111100006@apprentissage.beta.gouv.fr");
      assert.strictEqual(found.email_source, "contact");
    }
  });

  it.only("Vérifie qu'on ne peut pas confirmer un cfa déjà confirmé", async () => {
    const { cfas } = getComponents();
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    try {
      await cfas.confirm("11111111100006", "user2@apprentissage.beta.gouv.fr");
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "Une confirmation a déjà été enregistrée pour le cfa 11111111100006");
      const found = await Cfa.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, "11111111100006@apprentissage.beta.gouv.fr");
    }
  });

  it.only("Vérifie qu'on peut forcer la confirmation", async () => {
    const { cfas } = getComponents();
    await insertCfa({
      siret: "11111111100006",
      email: "11111111100006@apprentissage.beta.gouv.fr",
      statut: "confirmé",
    });

    await cfas.confirm("11111111100006", "user2@apprentissage.beta.gouv.fr", { force: true });

    const found = await Cfa.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, "confirmé");
  });
});
