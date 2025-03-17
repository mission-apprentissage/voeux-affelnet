const { Schema } = require("mongoose");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema");
const { USER_TYPE } = require("../constants/UserType");

const schema = new Schema({
  academies: {
    type: [academieSchema],
  },
});

const Csaio = User.discriminator(USER_TYPE.CSAIO, schema);

module.exports = Csaio;
