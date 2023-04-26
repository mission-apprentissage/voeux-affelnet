const { Schema } = require("mongoose");

const historySchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      // enum: []
    },
    variables: {
      type: Object,
      default: {},
    },
  },
  { _id: false }
);

module.exports = { historySchema };
