const assert = require("assert");
const buildRelationCsv = require("../../src/jobs/buildRelationCsv.js");
const { mockCatalogueApi, mockReferentielApi } = require("../utils/apiMocks.js");
const { writeData } = require("oleoduc");
const { createStream } = require("../utils/testUtils.js");
const { insertResponsable } = require("../utils/fakeData.js");

describe("buildRelationCsv", () => {
  function fakeCsvFile() {
    const csv = [];
    const stream = writeData((data) => csv.push(data));
    stream.content = csv;
    return stream;
  }

  function mockApis(data = {}) {
    mockCatalogueApi((client, responses) => {
      client
        .post((uri) => uri.includes("/auth/login"))
        .query(() => true)
        .reply(200, responses.login());
      client
        .get((uri) => uri.includes("/formations"))
        .query(() => true)
        .reply(200, responses.formations(data.formations));
    });
    mockReferentielApi((client, responses) => {
      client
        .get((uri) => /\/api\/v1\/organismes\/.*/.test(uri))
        .query(() => true)
        .reply(200, responses.organisme(data.organisme));

      client
        .get((uri) => uri === "/api/v1/organismes")
        .query(() => true)
        .reply(200, responses.organismes(data.organismes));
    });
  }

  xit("Vérifie qu'on peut trouver les CFA déjà importé", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;11111111100006;Centre de formation`
    );
    await insertResponsable({
      siret: "11111111100006",
      email: "test@email.fr",
      etablissements: [{ uai: "0751234J" }],
    });

    const stats = await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;test@email.fr;0751234J;importé\n",
    ]);
    assert.deepStrictEqual(stats, {
      conflicts: [],
      stats: {
        conflicts: 0,
        invalid: 0,
        total: 0,
        valid: 1,
      },
    });
  });

  xit("Vérifie qu'on peut trouver les CFA qui nécessite une mise à jour", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-YYYYY;11111111100006;Centre de formation`
    );
    await insertResponsable({
      siret: "11111111100006",
      email: "test@email.fr",
    });

    const stats = await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;test@email.fr;0751234J;maj nécessaire\n",
    ]);
    assert.deepStrictEqual(stats, {
      conflicts: [],
      stats: {
        conflicts: 0,
        invalid: 0,
        total: 0,
        valid: 1,
      },
    });
  });

  xit("Vérifie qu'on peut ajouter des relations complémentaires", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(`UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n`);

    const stats = await buildRelationCsv(
      { outRelationsFile, outInvalidsFile },
      {
        affelnet: affelnetCsv,
        relations: createStream(
          `siret_gestionnaire;email_gestionnaire;uai_etablissement\n11111111100006;test@email.fr;0751234J,0751234X`
        ),
      }
    );

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;test@email.fr;0751234J,0751234X;nouveau\n",
    ]);
    assert.deepStrictEqual(stats, {
      conflicts: [],
      stats: {
        conflicts: 0,
        invalid: 0,
        total: 0,
        valid: 1,
      },
    });
  });

  xit("Vérifie qu'on peut obtenir l'email d'un CFA via le catalogue", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;11111111100006;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_courriel: "catalogue@email.fr",
        },
      ],
    });

    await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;catalogue@email.fr;0751234J;nouveau\n",
    ]);
  });

  xit("Vérifie qu'on peut obtenir l'email d'un CFA via le référentiel", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;11111111100006;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_courriel: null,
        },
      ],
      organisme: {
        contacts: [
          {
            email: "referentiel@email.fr",
            confirmé: false,
            sources: ["catalogue"],
          },
        ],
      },
    });

    await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;referentiel@email.fr;0751234J;nouveau\n",
    ]);
  });

  xit("Vérifie qu'on peut obtenir le siret gestionnaire d'un CFA via le catalogue", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_siret: "11111111100006",
          etablissement_gestionnaire_courriel: "catalogue@email.fr",
        },
      ],
    });

    await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;catalogue@email.fr;0751234J;nouveau\n",
    ]);
  });

  xit("Vérifie qu'on peut obtenir le siret gestionnaire d'un CFA via le référentiel", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_siret: null,
          etablissement_gestionnaire_courriel: "referentiel@email.fr",
        },
      ],
      organismes: [{ siret: "11111111100006" }],
    });

    await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;referentiel@email.fr;0751234J;nouveau\n",
    ]);
  });

  xit("Vérifie qu'on peut obtenir le siret gestionnaire d'un CFA via les relations du référentiel", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_siret: null,
          etablissement_gestionnaire_courriel: "referentiel@email.fr",
        },
      ],
      organismes: [
        {
          siret: "22222222200006",
          nature: "formateur",
          relations: [
            {
              type: "formateur->responsable",
              siret: "11111111100006",
              label: "LYCEE POLYVALENT",
              referentiel: true,
              sources: ["fake"],
            },
          ],
        },
      ],
    });

    await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, [
      "siret;email;etablissements;statut\n",
      "11111111100006;referentiel@email.fr;0751234J;nouveau\n",
    ]);
  });

  xit("Vérifie qu'on détecte les conflits quand plusieurs emails sont disponibles", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;11111111100006;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_siret: "11111111100006",
          etablissement_gestionnaire_courriel: "catalogue@email.fr",
        },
        {
          etablissement_gestionnaire_siret: "11111111100006",
          etablissement_gestionnaire_courriel: "catalogue2@email.fr",
        },
      ],
    });

    const stats = await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, []);
    assert.deepStrictEqual(stats, {
      conflicts: [
        {
          emails: "catalogue@email.fr,catalogue2@email.fr",
          sirets: "11111111100006",
          uai: "0751234J",
        },
      ],
      stats: {
        conflicts: 1,
        invalid: 0,
        total: 0,
        valid: 0,
      },
    });
  });

  xit("Vérifie qu'on détecte les conflits quand plusieurs sirets sont disponibles", async () => {
    const outRelationsFile = fakeCsvFile();
    const outInvalidsFile = fakeCsvFile();
    const affelnetCsv = createStream(
      `UAI;CLE_MINISTERE_EDUCATIF;SIRET_UAI_GESTIONNAIRE;LIBELLE_TYPE_ETABLISSEMENT\n0751234J;CLE-ZZZZZ;11111111100006;Centre de formation`
    );
    mockApis({
      formations: [
        {
          etablissement_gestionnaire_siret: "11111111100006",
          etablissement_gestionnaire_courriel: "catalogue@email.fr",
        },
        {
          etablissement_gestionnaire_siret: "22222222200006",
          etablissement_gestionnaire_courriel: "catalogue@email.fr",
        },
      ],
    });

    const stats = await buildRelationCsv({ outRelationsFile, outInvalidsFile }, { affelnet: affelnetCsv });

    assert.deepStrictEqual(outRelationsFile.content, []);
    assert.deepStrictEqual(stats, {
      conflicts: [
        {
          emails: "catalogue@email.fr",
          sirets: "11111111100006,22222222200006",
          uai: "0751234J",
        },
      ],
      stats: {
        conflicts: 1,
        invalid: 0,
        total: 0,
        valid: 0,
      },
    });
  });
});
