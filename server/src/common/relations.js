const { getFromStorage } = require("./utils/ovhUtils");
const { oleoduc, writeData, accumulateData } = require("oleoduc");
const { parseCsv } = require("./utils/csvUtils");
const { Voeu } = require("./model");

async function loadRelations(relationCsv) {
  let stream = relationCsv || (await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-08-04-2022.csv"));

  let relations;
  await oleoduc(
    stream,
    parseCsv(),
    accumulateData(
      (acc, data) => {
        let siret = data["SIRET_UAI_GESTIONNAIRE"];
        if (!acc[siret]) {
          acc[siret] = [];
        }

        acc[siret].push(data["UAI"]);
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
  let uais = relations[siret] || [];

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
