const { Schema } = require("mongoose");
const User = require("./User");

const schema = new Schema({
  region: {
    type: new Schema(
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
    ),
  },
});

const Csaio = User.discriminator("Csaio", schema);

module.exports = Csaio;
