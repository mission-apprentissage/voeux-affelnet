const { Schema } = require("mongoose");
const { academieSchema } = require("./schemas/academieSchema");
const User = require("./User");
const { nested } = require("../utils/mongooseUtils");

const schema = new Schema({
  siret: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },

  uai: {
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
        uai: {
          type: String,
          required: true,
          index: true,
        },
        email: {
          type: String,
        },
        diffusionAutorisee: {
          type: Boolean,
          default: false,
        },
        voeux_date: {
          type: Date,
        },
        academie: academieSchema,
      }),
    ],
  },

  voeux_telechargements: {
    default: [],
    type: [
      nested({
        uai: {
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
    siret: "text",
    uai: "text",
    raison_sociale: "text",
    // "academie.nom": "text",
    email: "text",
    // statut: "text",
    // "etablissements.uai": "text",
  },
  { default_language: "french" }
);

const Gestionnaire = User.discriminator("Gestionnaire", schema);

module.exports = Gestionnaire;
