const { Schema } = require("mongoose");
const { UserType } = require("../constants/UserType");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema");

const schema = new Schema({
  academies: {
    type: [academieSchema],
  },
});

const Academie = User.discriminator(UserType.ACADEMIE, schema);

module.exports = Academie;
