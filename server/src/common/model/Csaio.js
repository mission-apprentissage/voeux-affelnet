const { Schema } = require("mongoose");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema.js");
const { UserType } = require("../constants/UserType");

const schema = new Schema({
  academies: {
    type: [academieSchema],
  },
});

const Csaio = User.discriminator(UserType.CSAIO, schema);

module.exports = Csaio;
