// const logger = require("../../common/logger.js");
const { compose, transformData } = require("oleoduc");
const { getCsvContent } = require("./csv.js");
const { parseCsv } = require("../../common/utils/csvUtils.js");
const { pickBy, isEmpty } = require("lodash");
const { trimValues } = require("../../common/utils/objectUtils.js");

const fixExtractionVoeux = async (originalCsv, overwriteCsv) => {
  // console.log("originalCsv", originalCsv);
  // console.log("overwriteCsv", overwriteCsv);

  const overwriteArray = await getCsvContent(overwriteCsv);

  console.log(overwriteArray);

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
          //   "SIRET UAI responsable": overwriteItem["Siret responsable"],
          //   "UAI Établissement responsable": overwriteItem["UAI responsable"],
          //   "SIRET UAI formateur": overwriteItem["Siret formateur"],
          //   "UAI Établissement formateur": overwriteItem["UAI formateur"],
          // });

          return {
            ...data,
            "SIRET UAI responsable": overwriteItem["Siret responsable"],
            "UAI Établissement responsable": overwriteItem["UAI responsable"],
            "SIRET UAI formateur": overwriteItem["Siret formateur"],
            "UAI Établissement formateur": overwriteItem["UAI formateur"],
          };
        }
      }

      return data;
    })
  );
};

module.exports = { fixExtractionVoeux };
