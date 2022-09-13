const assert = require("assert");
const { Readable } = require("stream");
const { Voeu } = require("../../src/common/model/index.js");
const { importJeunesUniquementEnApprentissage } = require("../../src/jobs/importJeunesUniquementEnApprentissage.js");
const { insertVoeu } = require("../utils/fakeData.js");

describe("importJeunesUniquemenetEnApprentissage", () => {
  it("Vérifie qu'on ajoute une meta pour un jeune ayant formulé des voeux uniquement en apprentissage", async () => {
    await insertVoeu({ apprenant: { ine: "111111111HA" } });
    await insertVoeu({ apprenant: { ine: "111111111HB" } });
    const input = Readable.from([
      `"Académie possédant le dossier élève";"INE"
"Orléans";"111111111HA"
`,
    ]);

    const stats = await importJeunesUniquementEnApprentissage(input);

    let voeu = await Voeu.findOne({ "apprenant.ine": "111111111HA" }).lean();
    assert.strictEqual(voeu._meta.jeune_uniquement_en_apprentissage, true);

    voeu = await Voeu.findOne({ "apprenant.ine": "111111111HB" }).lean();
    assert.strictEqual(voeu._meta.jeune_uniquement_en_apprentissage, undefined);

    assert.deepStrictEqual(stats, {
      failed: 0,
      total: 1,
      updated: 1,
    });
  });
});
