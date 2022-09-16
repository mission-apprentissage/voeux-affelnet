const { Schema } = require("mongoose");

const academieSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      index: true,
    },
    nom: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

module.exports = { academieSchema };
