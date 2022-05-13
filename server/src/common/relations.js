const { getFromStorage } = require("./utils/ovhUtils");
const { oleoduc, writeData, accumulateData, compose, transformData } = require("oleoduc");
const { parseCsv } = require("./utils/csvUtils");
const { Voeu } = require("./model");
const { isUAIValid } = require("./utils/validationUtils");
const logger = require("./logger");

async function getDefaultRelations() {
  let stream = await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-08-04-2022.csv");
  return compose(
    stream,
    parseCsv(),
    transformData((data) => {
      return {
        uai_etablissement_accueil: data["UAI"],
        siret_gestionnaire: data["SIRET_UAI_GESTIONNAIRE"],
      };
    })
  );
}

async function loadRelations(relationCsv) {
  const stream = relationCsv ? compose(relationCsv, parseCsv()) : await getDefaultRelations();

  let relations;
  await oleoduc(
    stream,
    accumulateData(
      (acc, data) => {
        const siret = data.siret_gestionnaire;
        if (!acc[siret]) {
          acc[siret] = [];
        }

        const uai = data.uai_etablissement_accueil;
        if (!isUAIValid(uai)) {
          isUAIValid(uai);
          logger.warn(`L'UAI de la relation est invalide ${uai}`);
        } else if (!acc[siret].includes(uai)) {
          acc[siret].push(uai);
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
