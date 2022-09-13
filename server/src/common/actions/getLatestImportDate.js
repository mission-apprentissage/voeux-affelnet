const { Voeu } = require("../model/index.js");

function getLatestImportDate(Collection = Voeu, filters = {}) {
  return Collection.aggregate([
    { $match: filters },
    { $unwind: "$_meta.import_dates" },
    { $group: { _id: "$_meta.import_dates" } },
    { $sort: { _id: -1 } },
  ]).then((agg) => agg[0]?._id);
}

module.exports = { getLatestImportDate };
