const { Voeu } = require("../model");

function getLatestImportDate(Collection = Voeu, filters = {}) {
  return Collection.aggregate(
    [
      { $match: filters },
      { $unwind: "$_meta.import_dates" },
      { $group: { _id: "$_meta.import_dates" } },
      { $sort: { _id: -1 } },
    ],
    {
      allowDiskUse: true,
    }
  ).then((agg) => agg[0]?._id);
}

module.exports = { getLatestImportDate };
