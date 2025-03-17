const assert = require("assert");
const { Readable } = require("stream");
const { importDossiers } = require("../../src/jobs/importDossiers.js");
const { Dossier } = require("../../src/common/model/index.js");
const { omit } = require("lodash");
const { mockTableauDeBordApi } = require("../utils/apiMocks.js");

const getJsonAsStream = (content) => {
  return Readable.from(JSON.stringify([content || {}]));
};

function mockApi(etablissements = []) {
  mockTableauDeBordApi((client, responses) => {
    client
      .post((uri) => uri.includes("/metabase/api/session"))
      .query(() => true)
      .reply(200, responses.login());

    client
      .post((uri) => uri.includes("/metabase/api/card/343/query/json"))
      .query(() => true)
      .reply(200, responses.dossiers(etablissements));
  });
}

describe("importDossiers", () => {
  xit("Vérifie qu'on peut importer les dossiers à partir de l'api metabase", async () => {
    mockApi([
      {
        dossier_id: "622fd47b84f2eb55806020f8",
        etablissement_num_departement: "75",
        etablissement_formateur_code_commune_insee: "75001",
        annee_formation: "1",
        uai_etablissement: "0751234J",
        email_contact: "contact@beta.gouv.fr",
        formation_cfd: "40025214",
        ine_apprenant: "111111111HA",
        prenom_apprenant: "Robert",
        nom_apprenant: "Doe",
        contrat_date_debut: "2022-09-01T14:00:00.000Z",
        contrat_date_fin: "2024-07-23T14:00:00.000Z",
        contrat_date_rupture: null,
        historique_statut_apprenant: [{ date_statut: "2022-07-01T14:00:00.000Z", valeur_statut: "3" }],
      },
    ]);

    let stats = await importDossiers();

    const dossier = await Dossier.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(dossier, ["_meta"]), {
      annee_formation: 1,
      contrat_date_debut: new Date("2022-09-01T14:00:00.000Z"),
      contrat_date_fin: new Date("2024-07-23T14:00:00.000Z"),
      dossier_id: "622fd47b84f2eb55806020f8",
      email_contact: "contact@beta.gouv.fr",
      formation_cfd: "40025214",
      ine_apprenant: "111111111HA",
      nom_apprenant: "Doe",
      prenom_apprenant: "Robert",
      statut: "apprenti",
      uai_etablissement: "0751234J",
      academie: {
        code: "01",
        nom: "Paris",
      },
    });

    assert.deepStrictEqual(dossier._meta.nom_complet, "ROBERT DOE");
    assert.ok(dossier._meta.import_dates[0]);
    assert.deepStrictEqual(stats, {
      created: 1,
      failed: 0,
      total: 1,
      updated: 0,
    });
  });

  xit("Vérifie qu'on peut importer les dossiers à partir d'un fichier", async () => {
    let stats = await importDossiers({
      input: getJsonAsStream({
        dossier_id: "622fd47b84f2eb55806020f8",
        etablissement_num_departement: "75",
        etablissement_formateur_code_commune_insee: "75001",
        annee_formation: "1",
        uai_etablissement: "0751234J",
        email_contact: "contact@beta.gouv.fr",
        formation_cfd: "40025214",
        ine_apprenant: "111111111HA",
        prenom_apprenant: "Robert",
        nom_apprenant: "Doe",
        contrat_date_debut: "2022-09-01T14:00:00.000Z",
        contrat_date_fin: "2024-07-23T14:00:00.000Z",
        contrat_date_rupture: null,
        historique_statut_apprenant: [{ date_statut: "2022-07-01T14:00:00.000Z", valeur_statut: "3" }],
      }),
    });

    const dossier = await Dossier.findOne({}, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(dossier, ["_meta"]), {
      academie: {
        code: "01",
        nom: "Paris",
      },
      annee_formation: 1,
      contrat_date_debut: new Date("2022-09-01T14:00:00.000Z"),
      contrat_date_fin: new Date("2024-07-23T14:00:00.000Z"),
      dossier_id: "622fd47b84f2eb55806020f8",
      email_contact: "contact@beta.gouv.fr",
      formation_cfd: "40025214",
      ine_apprenant: "111111111HA",
      nom_apprenant: "Doe",
      prenom_apprenant: "Robert",
      statut: "apprenti",
      uai_etablissement: "0751234J",
    });

    assert.deepStrictEqual(dossier._meta.nom_complet, "ROBERT DOE");
    assert.ok(dossier._meta.import_dates[0]);
    assert.deepStrictEqual(stats, {
      created: 1,
      failed: 0,
      total: 1,
      updated: 0,
    });
  });
});
