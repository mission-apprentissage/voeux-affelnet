const { Schema, model } = require("mongoose");

const Config = model(
  "Config",
  new Schema(
    {
      diffusion: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    { strict: false }
  ),
  "config"
);

module.exports = Config;
