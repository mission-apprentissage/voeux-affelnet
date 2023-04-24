const { Schema } = require("mongoose");

function nested(definition, options = {}) {
  return new Schema(definition, { _id: false, ...options });
}

function raw(Model) {
  return Model.collection;
}

async function paginate(Model, query, options = {}) {
  const total = await Model.count(query);
  const page = options.page || 1;
  const limit = options.items_par_page || 10;
  // const sort = options.sort || {};
  const skip = (page - 1) * limit;

  return {
    find: Model.find(query, options.select || {})
      .skip(skip)
      .limit(limit)
      // .sort(sort)
      .lean(),
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
};
