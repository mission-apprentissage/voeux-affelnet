const { Schema } = require("mongoose");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema.js");

const schema = new Schema({
  academies: {
    type: [academieSchema],
  },
});

const Csaio = User.discriminator("Csaio", schema);

module.exports = Csaio;
