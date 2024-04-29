const { Schema } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const User = require("./User");
const { historySchema } = require("./schemas/formateurHistorySchema");
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
            uai: {
              type: String,
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
              index: true,
            },
            uai: {
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

        // voeux_telechargements: {
        //   default: [],
        //   type: [
        //     nested({
        //       date: {
        //         type: Date,
        //         required: true,
        //         default: () => new Date(),
        //       },
        //     }),
        //   ],
        // },
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
