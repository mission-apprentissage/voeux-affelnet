const { omit } = require("lodash");
const assert = require("assert");
const { Readable } = require("stream");
const importMef = require("../../src/jobs/importMefs");
const { Mef } = require("../../src/common/model");

const getCsvAsStream = (content) => {
  return Readable.from([
    content ||
      `MEF|DISPOSITIF_FORMATION|FORMATION_DIPLOME|DUREE_DISPOSITIF|ANNEE_DISPOSITIF|LIBELLE_COURT|LIBELLE_LONG|DATE_OUVERTURE|DATE_FERMETURE|STATUT_MEF|NB_OPTION_OBLIGATOIRE|NB_OPTION_FACULTATIF|RENFORCEMENT_LANGUE|DUREE_PROJET|DUREE_STAGE|HORAIRE|MEF_INSCRIPTION_SCOLARITE|MEF_STAT_11|MEF_STAT_9|DATE_INTERVENTION|NUMERO_COMPTE|GESTION_DIFFUSION|LIBELLE_EDITION|ID|CREATED_AT|UPDATED_AT|N_COMMENTAIRE
3112320121|311|32023201|2|1|1BTS2 23201|1BTS2 TRAVAUX PUBLICS|01/09/1992|31/08/1993|3|0|1|N|0|8|N|O|32211023201|322110232|27/01/1995|OPS$BCNDEP8|02|1bts2 travaux publics|891|||
`,
  ]);
};

describe("importMefs", () => {
  it("Vérifie qu'on peut importer les codes MEF", async () => {
    await importMef({ csvStream: getCsvAsStream() });

    const results = await Mef.find().lean();
    assert.strictEqual(results.length, 1);
    assert.deepStrictEqual(omit(results[0], ["_id", "__v"]), {
      mef: "3112320121",
      libelle_long: "1BTS2 TRAVAUX PUBLICS",
      code_formation_diplome: "32023201",
    });
  });

  it("Vérifie qu'on peut importer les codes MEF avec des données invalides", async () => {
    await importMef({
      csvStream:
        getCsvAsStream(`MEF|DISPOSITIF_FORMATION|FORMATION_DIPLOME|DUREE_DISPOSITIF|ANNEE_DISPOSITIF|LIBELLE_COURT|LIBELLE_LONG|DATE_OUVERTURE|DATE_FERMETURE|STATUT_MEF|NB_OPTION_OBLIGATOIRE|NB_OPTION_FACULTATIF|RENFORCEMENT_LANGUE|DUREE_PROJET|DUREE_STAGE|HORAIRE|MEF_INSCRIPTION_SCOLARITE|MEF_STAT_11|MEF_STAT_9|DATE_INTERVENTION|NUMERO_COMPTE|GESTION_DIFFUSION|LIBELLE_EDITION|ID|CREATED_AT|UPDATED_AT|N_COMMENTAIRE
3112320121|311|32023201|2|1|1BTS2 23201|1BTS2 TRAVAUX PUBLICS|01/09/1992|31/08/1993|3|0|1|N|0|8|N|O|32211023201|322110232|27/01/1995|OPS$BCNDEP8|02|1bts2 travaux publics|891|||INV"ALID
`),
    });

    const results = await Mef.find().lean();
    assert.strictEqual(results.length, 1);
    assert.deepStrictEqual(omit(results[0], ["_id", "__v"]), {
      mef: "3112320121",
      libelle_long: "1BTS2 TRAVAUX PUBLICS",
      code_formation_diplome: "32023201",
    });
  });
});
