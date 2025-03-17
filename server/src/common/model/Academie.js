const { Schema } = require("mongoose");
const { USER_TYPE } = require("../constants/UserType");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema");

const schema = new Schema({
  academies: {
    type: [academieSchema],
  },
});

const Academie = User.discriminator(USER_TYPE.ACADEMIE, schema);

module.exports = Academie;
