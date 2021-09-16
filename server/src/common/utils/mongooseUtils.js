const { Schema } = require("mongoose");

function nested(definition, options = {}) {
  return new Schema(definition, { _id: false, ...options });
}

function raw(Model) {
  return Model.collection;
}

async function paginate(Model, query, options = {}) {
  let total = await Model.count(query);
  let page = options.page || 1;
  let limit = options.items_par_page || 10;
  let skip = (page - 1) * limit;

  return {
    find: Model.find(query, options.projection || {})
      .skip(skip)
      .limit(limit)
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
