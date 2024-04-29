const { Schema } = require("mongoose");
const { FormateurActions } = require("../../constants/History");

const historySchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    action: {
      type: String,
      enum: Object.values(FormateurActions),
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
