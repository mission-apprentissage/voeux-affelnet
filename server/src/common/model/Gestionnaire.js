const { Schema } = require("mongoose");
const User = require("./User");
const { nested } = require("../utils/mongooseUtils");
const { academieSchema } = require("./schemas/academieSchema.js");

const schema = new Schema({
  siret: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  raison_sociale: {
    type: String,
  },
  academie: {
    type: academieSchema,
  },
  // diffusionAutorisee: {
  //   type: Boolean,
  //   default: undefined,
  // },
  formateurs: {
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
    raison_sociale: "text",
    // "academie.nom": "text",
    email: "text",
    // statut: "text",
    // "formateurs.uai": "text",
  },
  { default_language: "french" }
);

const Gestionnaire = User.discriminator("Gestionnaire", schema);

module.exports = Gestionnaire;
