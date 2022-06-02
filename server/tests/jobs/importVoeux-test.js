const assert = require("assert");
const { Readable } = require("stream");
const { Voeu, Cfa } = require("../../src/common/model");
const importVoeux = require("../../src/jobs/importVoeux");
const { DateTime } = require("luxon");
const { insertMef, insertCfa } = require("../utils/fakeData");

describe("importVoeux", () => {
  it("Vérifie qu'on peut importer les voeux du fichier Affelnet", async () => {
    const importDate = new Date();
    await insertMef({
      mef: "2472521431",
      libelle_long: "2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.",
      code_formation_diplome: "40025214",
    });

    const stats = await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HA";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
"Aix-Marseille";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ]),
      { importDate }
    );

    const { _meta, ...found } = await Voeu.findOne({ "apprenant.ine": "111111111HA" }, { _id: 0, __v: 0 }).lean();
    assert.deepStrictEqual(found, {
      academie: { nom: "Aix-Marseille", code: "02" },
      apprenant: {
        ine: "111111111HA",
        nom: "Dupont",
        prenom: "Robert",
        adresse: {
          ligne_3: "36 rue des lilas",
          code_postal: "13001",
          ville: "MARSEILLE",
          pays: "FRANCE",
        },
      },
      responsable: {
        email_1: "test1@apprentissage.beta.gouv.fr",
        email_2: "test2@apprentissage.beta.gouv.fr",
        telephone_1: "0611111111",
        telephone_2: "0611111111",
      },
      formation: {
        code_affelnet: "1A111111",
        code_formation_diplome: "40025214",
        mef: "2472521431",
        libelle: "2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.",
      },
      etablissement_origine: {
        uai: "1111111A",
        nom: "COLLEGE JULES FERRY",
        ville: "MARSEILLE",
      },
      etablissement_accueil: {
        uai: "1111111R",
        nom: "LP LYCEE PRIVAT",
        ville: "MARSEILLE CEDEX",
      },
    });
    assert.deepStrictEqual(_meta.anomalies, []);
    assert.deepStrictEqual(_meta.import_dates[0], importDate);
    assert.deepStrictEqual(stats, {
      total: 2,
      updated: 0,
      updated_fields: [],
      created: 2,
      invalid: 0,
      deleted: 0,
      failed: 0,
      orphans: 2,
    });
  });

  it("Vérifie qu'on peut importer les voeux en définissant manuellement la date d'import", async () => {
    const importDate = DateTime.fromISO("2021-06-15T14:00:00.000Z").toJSDate();

    await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ]),
      { importDate }
    );

    const found = await Voeu.findOne().lean();
    assert.deepStrictEqual(found._meta.import_dates, [importDate]);
  });

  it("Vérifie qu'on met à jour le CFA pour indiquer qu'il a des voeux", async () => {
    const importDate = new Date();
    await insertCfa({ siret: "11111111100006", etablissements: [{ uai: "0751234J" }] });

    await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"0751234J";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ]),
      { importDate }
    );

    let found = await Voeu.findOne().lean();
    assert.deepStrictEqual(found._meta.import_dates, [importDate]);
    found = await Cfa.findOne().lean();
    const etablissement = found.etablissements[0];
    assert.deepStrictEqual(etablissement.voeux_date, importDate);
    assert.deepStrictEqual(etablissement.uai, "0751234J");
  });

  it("Vérifie qu'on met à un jour un voeux et le cfa lors d'un nouvel import", async () => {
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
    const today = new Date();
    await insertCfa({ username: "11111111100006", etablissements: [{ uai: "0751234J" }] });
    await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HA";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"COLLEGE";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"1A111111";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"0751234J";"LP";"LYCEE PRIVAT";"MARSEILLE"
`,
      ]),
      { importDate: yesterday }
    );

    const stats = await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HA";"Dupont";"Robert";;;"-";"-";"31 rue des lilas";"-";"";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"COLLEGE";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"1A111111";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"0751234J";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"`,
      ]),
      { importDate: today }
    );

    const results = await Voeu.find().lean();
    assert.strictEqual(results.length, 1);
    assert.deepStrictEqual(results[0]._meta.import_dates, [yesterday, today]);
    assert.deepStrictEqual(results[0].apprenant.adresse.ligne_3, "31 rue des lilas");
    assert.deepStrictEqual(results[0]._meta.anomalies, [
      {
        path: ["apprenant.adresse.code_postal"],
        type: "any.required",
      },
    ]);
    const found = await Cfa.findOne().lean();
    assert.deepStrictEqual(found.etablissements[0].voeux_date, today);

    assert.deepStrictEqual(stats, {
      total: 1,
      created: 0,
      updated: 1,
      updated_fields: ["apprenant.adresse", "etablissement_accueil.ville"],
      invalid: 0,
      deleted: 0,
      failed: 0,
      orphans: 0,
    });
  });

  it("Vérifie qu'on ne met pas à jour le CFA si le voeu n'a pas été modifié dans le nouvel import", async () => {
    const yesterday = DateTime.now().minus({ days: 1 }).toJSDate();
    const today = new Date();
    await insertCfa({ username: "11111111100006", etablissements: [{ uai: "0751234J", voeux_date: yesterday }] });
    await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"0751234J";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ]),
      { importDate: yesterday }
    );
    await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"0751234J";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ]),
      { importDate: today }
    );

    let found = await Voeu.findOne().lean();
    assert.deepStrictEqual(found._meta.import_dates, [yesterday, today]);
    found = await Cfa.findOne().lean();
    assert.deepStrictEqual(found.etablissements[0].voeux_date, yesterday);
  });

  it("Vérifie qu'on supprime les voeux qui n'existent plus", async () => {
    await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HA";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
"Aix-Marseille";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ])
    );

    const stats = await importVoeux(
      Readable.from([
        `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HA";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
      ])
    );

    const count = await Voeu.countDocuments();
    assert.strictEqual(count, 1);

    assert.deepStrictEqual(stats, {
      total: 1,
      created: 0,
      updated: 0,
      updated_fields: [],
      invalid: 0,
      deleted: 1,
      failed: 0,
      orphans: 0,
    });
  });

  it("Identifie les voeux invalides", async () => {
    const csvStream = Readable.from([
      `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"INVALID";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"INVALID";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
    ]);

    const stats = await importVoeux(csvStream);

    const count = await Voeu.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, {
      total: 1,
      updated: 0,
      updated_fields: [],
      created: 0,
      invalid: 1,
      deleted: 0,
      failed: 0,
      orphans: 0,
    });
  });

  it("Identifie les voeux avec des anomalies", async () => {
    const csvStream = Readable.from([
      `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"";"111111111HB";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"13001";"MARSEILLE";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"JULES FERRY";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
    ]);

    const stats = await importVoeux(csvStream);

    const count = await Voeu.countDocuments();
    assert.strictEqual(count, 0);
    assert.deepStrictEqual(stats, {
      total: 1,
      updated: 0,
      updated_fields: [],
      created: 0,
      invalid: 1,
      deleted: 0,
      failed: 0,
      orphans: 0,
    });
  });

  it("Corrige les valeurs invalides (téléphone et codes postaux)", async () => {
    const csvStream = Readable.from([
      `"Académie possédant le dossier élève";"INE";"Nom de l'élève";"Prénom 1";"Prénom 2";"Prénom 3";"Adresse de l'élève - Ligne 1";"Adresse de l'élève - Ligne 2";"Adresse de l'élève - Ligne 3";"Adresse de l'élève - Ligne 4";"Code postal";"VILLE";"PAYS";"Téléphone personnel";"Téléphone professionnel";"Téléphone portable";"Téléphone responsable 1";"Téléphone responsable 2";"Mail responsable 1";"Mail responsable 2";"Mnémonique MEF origine de l'élève";"Code Spécialité du MEF origine de l'élève";"Libellé formation origine de l'élève";"Code Option 1 d'origine de l'élève";"Libellé  Option 1 d'origine de l'élève";"Code Option 2 d'origine de l'élève";"Libellé Option 2 d'origine de l'élève";"Code LV1 d'origine de l'élève";"Libellé LV1 origine de l'élève";"Code LV2 d'origine de l'élève";"Libellé LV2 origine de l'élève";"Code UAI étab. origine";"Type étab. origine";"Libellé étab. origine";"Ville étab. origine";"Code UAI CIO origine";"Libellé CIO origine";"Rang du vœu";"Code offre de formation (vœu)";"Code MEF";"Avec barème ?";"Mnémonique MEF de l'offre de formation";"Code spécialité de l'offre de formation";"Libellé formation";"Code Enseignement Optionnel";"Libellé Enseignement Optionnel";"Dossier de candidature en internat demandé ?";"Code LV1 demandée";"Libellé  LV1 demandée";"Code LV2 demandée";"Libellé LV2 demandée";"Code UAI étab. Accueil";"Type étab. Accueil";"Libellé établissement Accueil";"Ville étab. Accueil"
"Aix-Marseille";"111111111HA";"Dupont";"Robert";;;"-";"-";"36 rue des lilas";"-";"4200";"SISTERON";"FRANCE";"-";"-";"-";"+33611111111";"+33611111111";"test1@apprentissage.beta.gouv.fr";"test2@apprentissage.beta.gouv.fr";"3EME";;"3EME";"-";"-";"-";"-";"AGL1";"ANGLAIS LV1";"ESP2";"ESPAGNOL LV2";"1111111A";"COLLEGE";"COLLEGE";"MARSEILLE";"1111111G";"CIO MARSEILLE";"2";"1A111111";"24725214310";"Non";"2NDPRO";"25214";"2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.";"-";"-";"Non";"-";"-";"-";"-";"1111111R";"LP";"LYCEE PRIVAT";"MARSEILLE CEDEX"
`,
    ]);

    await importVoeux(csvStream);

    const doc = await Voeu.findOne().lean();
    assert.strictEqual(doc.apprenant.adresse.code_postal, "04200");
    assert.strictEqual(doc.responsable.telephone_1, "0611111111");
  });
});
