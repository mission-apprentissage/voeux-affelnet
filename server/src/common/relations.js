const { getFromStorage } = require("./utils/ovhUtils");
const { oleoduc, writeData, accumulateData } = require("oleoduc");
const { parseCsv } = require("./utils/csvUtils");
const { Voeu } = require("./model");

async function loadRelations(relationCsv) {
  const stream = relationCsv || (await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-08-04-2022.csv"));

  let relations;
  await oleoduc(
    stream,
    parseCsv(),
    accumulateData(
      (acc, data) => {
        const siret = data["SIRET_UAI_GESTIONNAIRE"];
        if (!acc[siret]) {
          acc[siret] = [];
        }

        if (!acc[siret].includes(data["UAI"])) {
          acc[siret].push(data["UAI"]);
        }
        return acc;
      },
      { accumulator: {} }
    ),
    writeData((acc) => {
      relations = acc;
    })
  );

  return relations;
}

async function getEtablissements(siret, relations) {
  const uais = relations[siret] || [];

  return Promise.all(
    uais.map(async (uai) => {
      const voeu = await Voeu.findOne({ "etablissement_accueil.uai": { $in: uais } });
      return {
        uai,
        ...(voeu ? { voeux_date: voeu._meta.import_dates[voeu._meta.import_dates.length - 1] } : {}),
      };
    })
  );
}

module.exports = { getEtablissements, loadRelations };
