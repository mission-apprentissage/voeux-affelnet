const { oleoduc, writeData } = require("oleoduc");
const { parseCsv } = require("../../common/utils/csvUtils.js");

const getCsvContent = async (csv) => {
  const content = [];
  await oleoduc(
    csv,
    parseCsv({
      on_record: (record) => {
        return Object.keys(record).reduce((acc, curr) => {
          acc[curr] = record[curr].replaceAll(";", ",");
          return acc;
        }, {});
      },
    }),
    writeData((data) => {
      content.push(data);
    })
  );
  return content?.length ? content : null;
};

module.exports = {
  getCsvContent,
};
