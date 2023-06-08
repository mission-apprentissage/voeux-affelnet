const { Schema, model } = require("mongoose");

const Alert = model(
  "Alert",
  new Schema(
    {
      msg: {
        type: String,
        required: true,
      },
      time: {
        type: Date,
        required: false,
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },
    { strict: false }
  ),
  "alerts"
);

module.exports = Alert;
