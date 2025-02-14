const { Schema } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const User = require("./User");
const { historySchema } = require("./schemas/delegueHistorySchema");
const { UserType } = require("../constants/UserType");

const schema = new Schema({
  relations: {
    required: true,
    default: [],
    type: [
      nested({
        etablissement_responsable: {
          required: true,
          default: null,
          type: nested({
            siret: {
              type: String,
              required: true,
              index: true,
            },
          }),
        },

        etablissement_formateur: {
          required: true,
          default: null,
          type: nested({
            siret: {
              type: String,
              required: true,
              index: true,
            },
          }),
        },

        active: {
          type: Boolean,
          default: false,
        },
      }),
    ],
  },

  histories: {
    default: [],
    type: [historySchema],
  },
});

schema.index(
  {
    email: "text",
  },
  { default_language: "french" }
);

const Delegue = User.discriminator(UserType.DELEGUE, schema);

module.exports = Delegue;
