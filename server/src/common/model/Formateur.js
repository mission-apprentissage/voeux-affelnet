const { Schema } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const User = require("./User");
const { academieSchema } = require("./schemas/academieSchema");

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
  cp: {
    type: String,
  },
  commune: {
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

const Formateur = User.discriminator("Formateur", schema);

module.exports = Formateur;
