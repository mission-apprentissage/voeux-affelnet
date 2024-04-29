const { Schema } = require("mongoose");
const { ResponsableActions } = require("../../constants/History");

const historySchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    action: {
      type: String,
      enum: Object.values(ResponsableActions),
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
