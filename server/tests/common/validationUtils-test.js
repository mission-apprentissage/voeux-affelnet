const assert = require("assert");
const { isUAIValid, createUAI } = require("../../src/common/utils/validationUtils");

describe("validationUtils", () => {
  it("permet de valider une UAI", () => {
    assert.strictEqual(isUAIValid("0010856A"), true);
    assert.strictEqual(isUAIValid("0000856A"), false);
    assert.strictEqual(isUAIValid("0010856B"), false);
    assert.strictEqual(isUAIValid("00108"), false);
    assert.strictEqual(isUAIValid(null), false);
    assert.strictEqual(isUAIValid(undefined), false);
    assert.strictEqual(isUAIValid(""), false);
  });

  it("permet de créer un UAI", () => {
    assert.strictEqual(createUAI("0751234"), "0751234J");

    try {
      assert.strictEqual(createUAI(null), false);
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "Le code ne doit contenir que 7 caractères sans le checksum");
    }
  });
});
