// const logger = require("../../common/logger.js");
const { compose, transformData } = require("oleoduc");
const { getCsvContent } = require("./csv.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");
const { pickBy, isEmpty } = require("lodash");
const { trimValues } = require("../../common/utils/objectUtils.js");

const fixExtractionVoeux = async (originalCsv, overwriteCsv) => {
  // console.log("originalCsv", originalCsv);
  // console.log("overwriteCsv", overwriteCsv);

  const overwriteArray = !!overwriteCsv && (await getCsvContent(overwriteCsv));

  // console.log(overwriteArray);

  return compose(
    originalCsv,
    parseCsv({
      quote: '"',
      on_record: (record) => {
        const filtered = pickBy(record, (v) => !isEmpty(v) && v !== "-");
        return trimValues(filtered);
      },
    }),
    transformData(async (data) => {
      if (overwriteArray) {
        const academie = data["Académie possédant le dossier élève et l'offre de formation"];
        const code_offre = data["Code offre de formation (vœu)"];
        const affelnet_id = `${academie}/${code_offre}`;

        const overwriteItem = overwriteArray.find((item) => item["Affelnet_id"] === affelnet_id);
        if (overwriteItem) {
          // logger.warn(`Données écrasées pour la formation ${affelnet_id}`, {
          //   "Code UAI étab. Accueil": overwriteItem["UAI accueil"],
          //   "SIRET UAI gestionnaire": overwriteItem["Siret responsable"],
          //   "UAI Établissement responsable": overwriteItem["UAI responsable"],
          //   "SIRET UAI formateur": overwriteItem["Siret formateur"],
          //   "UAI Établissement formateur": overwriteItem["UAI formateur"],
          // });

          return {
            ...data,
            "Code UAI étab. Accueil": overwriteItem["UAI accueil"]?.length
              ? overwriteItem["UAI accueil"]
              : data["Code UAI étab. Accueil"],
            "SIRET UAI gestionnaire": overwriteItem["Siret responsable"]?.length
              ? overwriteItem["Siret responsable"]
              : data["SIRET UAI gestionnaire"],
            "UAI Établissement responsable": overwriteItem["UAI responsable"]?.length
              ? overwriteItem["UAI responsable"]
              : data["UAI Établissement responsable"],
            "SIRET UAI formateur": overwriteItem["Siret formateur"]?.length
              ? overwriteItem["Siret formateur"]
              : data["SIRET UAI formateur"],
            "UAI Établissement formateur": overwriteItem["UAI formateur"]?.length
              ? overwriteItem["UAI formateur"]
              : data["UAI Établissement formateur"],
          };
        }
      }

      return data;
    })
  );
};

module.exports = { fixExtractionVoeux };
