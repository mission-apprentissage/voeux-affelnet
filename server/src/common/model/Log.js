const { Schema, model } = require("mongoose");

module.exports = model(
  "Log",
  new Schema(
    {
      msg: {
        type: String,
        required: true,
      },
      level: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      time: {
        type: Date,
        required: true,
      },
    },
    { strict: false }
  ),
  "logs"
);
