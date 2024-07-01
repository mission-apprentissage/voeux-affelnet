const { Schema } = require("mongoose");
const { RelationActions } = require("../../constants/History");

const historySchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    action: {
      type: String,
      enum: Object.values(RelationActions),
      required: true,
    },
    variables: {
      type: Object,
      default: {},
    },
  },
  { _id: false }
);

module.exports = { historySchema };
