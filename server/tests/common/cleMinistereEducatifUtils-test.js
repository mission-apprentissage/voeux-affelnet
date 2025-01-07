const assert = require("assert");
const {
  getSiretResponsableFromCleMinistereEducatif,
  getSiretFormateurFromCleMinistereEducatif,
} = require("../../src/common/utils/cleMinistereEducatifUtils");

describe("cleMinistereEducatifUtils", () => {
  it.skip("getSiretResponsableFromCleMinistereEducatif", () => {
    assert.strictEqual(
      getSiretResponsableFromCleMinistereEducatif("077508P01211300217930001813002179300026-27229#L01"),
      "13002179300018"
    );
  });

  it.skip("getSiretFormateurFromCleMinistereEducatif", () => {
    assert.strictEqual(
      getSiretFormateurFromCleMinistereEducatif("077508P01211300217930001813002179300026-27229#L01"),
      "13002179300026"
    );
  });
});
