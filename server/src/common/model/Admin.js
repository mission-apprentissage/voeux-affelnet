const { Schema } = require("mongoose");
const { USER_TYPE } = require("../constants/UserType");
const User = require("./User");

const schema = new Schema({});

const Admin = User.discriminator(USER_TYPE.ADMIN, schema);

module.exports = Admin;
