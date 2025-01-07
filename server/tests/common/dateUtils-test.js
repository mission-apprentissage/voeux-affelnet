const assert = require("assert");
const { sortAscending, sortDescending } = require("../../src/common/utils/dateUtils");

describe("dateUtils", () => {
  const a = "2022-06-16T13:41:45.865Z";
  const b = "2022-06-17T13:41:45.865Z";
  const c = "2022-06-18T13:41:45.865Z";

  it.skip("Peut trier les dates dans l'ordre ascendant", () => {
    const dates = [c, a, b];
    const results = dates.sort(sortAscending);

    assert.strictEqual(results[0], a);
    assert.strictEqual(results[1], b);
    assert.strictEqual(results[2], c);
  });

  it.skip("Peut trier les dates dans l'ordre descendant", () => {
    const dates = [c, a, b];
    const results = dates.sort(sortDescending);

    assert.strictEqual(results[0], c);
    assert.strictEqual(results[1], b);
    assert.strictEqual(results[2], a);
  });
});
