const { Schema } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const User = require("./User");

const schema = new Schema({
  uai: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },

  siret: {
    type: String,
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

  gestionnaires: {
    required: true,
    default: [],
    type: [
      nested({
        siret: {
          type: String,
          required: true,
          index: true,
        },
      }),
    ],
  },
});

schema.index(
  {
    uai: "text",
    // libelle_etablissement: "text",
  },
  { default_language: "french" }
);

const Formateur = User.discriminator("Formateur", schema);

module.exports = Formateur;
