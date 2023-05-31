const { Schema } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema");
const { historySchema } = require("./schemas/formateurHistorySchema");
const { UserType } = require("../constants/UserType");

const schema = new Schema({
  uai: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },

  siret: {
    type: String,
    index: true,
  },

  raison_sociale: {
    type: String,
  },

  libelle_ville: {
    type: String,
  },
  adresse: {
    type: String,
  },

  etablissements: {
    required: true,
    default: [],
    type: [
      nested({
        siret: {
          type: String,
          required: true,
          index: true,
        },
        uai: {
          type: String,
          index: true,
        },
        voeux_date: {
          type: Date,
        },
        nombre_voeux: {
          type: Number,
          default: 0,
        },
        academie: academieSchema,
      }),
    ],
  },

  voeux_telechargements: {
    default: [],
    type: [
      nested({
        siret: {
          type: String,
          required: true,
          index: true,
        },
        date: {
          type: Date,
          required: true,
          default: () => new Date(),
        },
      }),
    ],
  },

  academie: {
    type: academieSchema,
  },

  histories: {
    default: [],
    type: [historySchema],
  },
});

schema.index(
  {
    uai: "text",
    siret: "text",
    raison_sociale: "text",
    email: "text",
  },
  { default_language: "french" }
);

const Formateur = User.discriminator(UserType.FORMATEUR, schema);

module.exports = Formateur;
