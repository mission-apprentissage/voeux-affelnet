const { createStream } = require("../../../../tests/utils/testUtils");

function fakeRelationsCsv(siret, uais) {
  const lines = [`UAI;SIRET_UAI_GESTIONNAIRE\n`, ...uais.map((uai) => `${uai};${siret}\n`)];
  return createStream(lines.join(""));
}

module.exports = { fakeRelationsCsv };
