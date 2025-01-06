const assert = require("assert");
const { insertEtablissement, createEmail } = require("../../utils/fakeData");
const { Etablissement } = require("../../../src/common/model");
const { confirm } = require("../../../src/common/actions/confirm");
const { UserStatut } = require("../../../src/common/constants/UserStatut");

describe("confirm", () => {
  it("Vérifie qu'on peut confirmer un responsable", async () => {
    const etablissement = await insertEtablissement();

    await confirm(etablissement.username, etablissement.email);
    const found = await Etablissement.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, UserStatut.CONFIRME);
  });

  it("Vérifie qu'on peut confirmer un cfa avec une nouvelle adresse email", async () => {
    const etablissement = await insertEtablissement();

    const new_email = createEmail();
    await confirm(etablissement.username, new_email);

    const found = await Etablissement.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, UserStatut.CONFIRME);
    assert.strictEqual(found.email, new_email);
  });

  it("Vérifie qu'on ne peut pas confirmer un cfa sans une adresse email", async () => {
    const etablissement = await insertEtablissement();

    try {
      await confirm(etablissement.username);
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(
        e.message,
        `Une confirmation a déjà été enregistrée pour le compte ${etablissement.username}`
      );
      const found = await Etablissement.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, etablissement.email);
    }
  });

  it("Vérifie qu'on ne peut pas confirmer un cfa déjà confirmé", async () => {
    const etablissement = await insertEtablissement({
      statut: UserStatut.CONFIRME,
    });

    try {
      const new_email = createEmail();
      await confirm(etablissement.username, new_email);
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(
        e.message,
        `Une confirmation a déjà été enregistrée pour le compte ${etablissement.username}`
      );
      const found = await Etablissement.findOne({}, { _id: 0 }).lean();
      assert.strictEqual(found.email, etablissement.email);
    }
  });

  it("Vérifie qu'on peut forcer la confirmation", async () => {
    const etablissement = await insertEtablissement({
      statut: UserStatut.CONFIRME,
    });

    const new_email = createEmail();
    await confirm(etablissement.username, new_email, { force: true });

    const found = await Etablissement.findOne({}, { _id: 0 }).lean();
    assert.strictEqual(found.statut, UserStatut.CONFIRME);
  });
});
