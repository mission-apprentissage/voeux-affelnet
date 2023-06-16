const assert = require("assert");
const {
  getSiretGestionnaireFromCleMinistereEducatif,
  getSiretFormateurFromCleMinistereEducatif,
} = require("../../src/common/utils/cleMinistereEducatifUtils");

describe("cleMinistereEducatifUtils", () => {
  it("getSiretGestionnaireFromCleMinistereEducatif", () => {
    assert.strictEqual(
      getSiretGestionnaireFromCleMinistereEducatif("077508P01211300217930001813002179300026-27229#L01"),
      "13002179300018"
    );
  });

  it("getSiretFormateurFromCleMinistereEducatif", () => {
    assert.strictEqual(
      getSiretFormateurFromCleMinistereEducatif("077508P01211300217930001813002179300026-27229#L01"),
      "13002179300026"
    );
  });
});
