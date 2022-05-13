const { createStream } = require("../../../../tests/utils/testUtils");

function fakeRelationsCsv(siret, uais) {
  const lines = [`uai_etablissement_accueil;siret_gestionnaire`, ...uais.map((uai) => `${uai};${siret}`)];
  return createStream(lines.join("\n"));
}

module.exports = { fakeRelationsCsv };
