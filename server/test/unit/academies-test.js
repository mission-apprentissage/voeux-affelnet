const assert = require("assert");

const { findAcademieByName, findAcademieByUai } = require("../../src/common/academies");

describe(__filename, () => {
  it("Permet de trouver une académie avec son nom", () => {
    let besancon = {
      code: "03",
      nom: "Besançon",
      departements: [
        {
          code: "70",
          nom: "Haute-Saône",
        },
        {
          code: "90",
          nom: "Territoire de Belfort",
        },
        {
          code: "39",
          nom: "Jura",
        },
        {
          code: "25",
          nom: "Doubs",
        },
      ],
    };

    assert.deepStrictEqual(findAcademieByName("Besançon"), besancon);
    assert.deepStrictEqual(findAcademieByName("UNKNOWN"), null);
  });

  it("Permet de trouver une académie avec son UAI", () => {
    assert.deepStrictEqual(findAcademieByUai("0751234J").nom, "Paris");
    assert.deepStrictEqual(findAcademieByUai("6200001G").nom, "Corse");
    assert.deepStrictEqual(findAcademieByUai("9871234J").nom, "Polynésie Française");
    assert.deepStrictEqual(findAcademieByUai("UNKNOWN"), null);
  });
});
