const assert = require("assert");
const {
  getGestionnaireSiretFromCleMinistereEducatif,
  getSiretFormateurFromCleMinistereEducatif,
} = require("../../src/common/utils/cleMinistereEducatifUtils");

describe("cleMinistereEducatifUtils", () => {
  it("getGestionnaireSiretFromCleMinistereEducatif", () => {
    assert.strictEqual(
      getGestionnaireSiretFromCleMinistereEducatif("077508P01211300217930001813002179300026-27229#L01"),
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
