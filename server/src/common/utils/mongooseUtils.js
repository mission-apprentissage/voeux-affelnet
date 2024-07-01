const mongoose = require("mongoose");

// const CacheRegistry = mongoose.model(
//   "cache_registry",
//   new mongoose.Schema({
//     value: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     total: {
//       type: Number,
//       default: 0,
//     },
//   })
// );

// const emptySchema = new mongoose.Schema();

function nested(definition, options = {}) {
  return new mongoose.Schema(definition, { _id: false, ...options });
}

function raw(model) {
  return model.collection;
}

/**
 *
 * @param {import("mongoose").Model} model
 * @param {import("mongoose").FilterQuery<Model>} query
 * @param {Object} options
 * @param {Number} options.page
 * @param {Number} options.items_par_page
 * @param {Object} options.sort
 *
 * @returns {Promise<{find: Promise<import("mongoose").Model[]>, pagination: {page: Number, items_par_page: Number, nombre_de_page: Number, total: Number}}>
 */
async function paginate(model, query, options = {}) {
  const total = await model.count(query).cacheQuery();
  const page = options.page || 1;
  const limit = options.items_par_page || 10;
  const sort = options.sort || {};
  const skip = (page - 1) * limit;

  return {
    find: model
      .find(query, options.select || {})
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean(),
    pagination: {
      page,
      items_par_page: limit,
      nombre_de_page: Math.ceil(total / limit) || 1,
      total,
    },
  };
}

/**
 *
 * @param {import("mongoose").Model} model
 * @param {import("mongoose").PipelineStage[]} aggregation
 * @param {Object} options Options
 * @param {Number} options.page Numéro de la page
 * @param {Number} options.items_par_page Nombre d'éléments par page
 * @param {Object} options.sort Tri
 *
 * @returns {Promise<{find: Promise<import("mongoose").Model[]>, pagination: {page: Number, items_par_page: Number, nombre_de_page: Number, total: Number}}>
 */
async function aggregate(model, aggregation, options = {}) {
  // const aggregationToken = JSON.stringify(aggregation);

  // if (!(await CacheRegistry.exists({ value: aggregationToken }))) {
  //   await CacheRegistry.create({
  //     value: aggregationToken,
  //     total: (await model.aggregate([...aggregation, { $count: "total" }]))?.[0]?.total || 0,
  //   });
  // }

  // const cache = await CacheRegistry.findOne({ value: aggregationToken });
  // const cacheKey = cache._id.toString();

  // const CacheModel = mongoose.model(cacheKey, emptySchema, cacheKey);

  // await CacheModel.createCollection({
  //   viewOn: model.collection.name,
  //   pipeline: aggregation,
  // });

  // const total = cache.total;

  const total = (await model.aggregate([...aggregation, { $count: "total" }]).cachePipeline())?.[0]?.total || 0;
  const page = options.page || 1;
  const limit = options.items_par_page || 10;
  const sort = options.sort || {};
  const skip = (page - 1) * limit;

  // const query = CacheModel.find({}).sort(sort).cacheQuery();
  const query = model.aggregate([...aggregation, { $sort: sort }]).cachePipeline();

  // let find = CacheModel.aggregate([{ $sort: sort }, { $skip: skip }, { $limit: limit }]);

  // let find = await model
  //   .aggregate([...aggregation, { $sort: sort }, { $skip: skip }, { $limit: limit }], {
  //     allowDiskUse: true,
  //   })
  //   .cachePipeline();

  return {
    results: (await query).slice(skip, skip + limit),
    pagination: {
      page,
      items_par_page: limit,
      nombre_de_page: Math.ceil(total / limit) || 1,
      total,
    },
  };
}

module.exports = {
  nested,
  raw,
  paginate,
  aggregate,
};
