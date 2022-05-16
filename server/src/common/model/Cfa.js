const { Schema } = require("mongoose");
const User = require("./User");
const { nested } = require("../utils/mongooseUtils");

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
    type: new Schema(
      {
        code: {
          type: String,
          required: true,
          index: true,
        },
        nom: {
          type: String,
          required: true,
        },
      },
      { _id: false }
    ),
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
    "academie.nom": "text",
    email: "text",
    statut: "text",
    "etablissements.uai": "text",
  },
  { default_language: "french" }
);

const Cfa = User.discriminator("Cfa", schema);

module.exports = Cfa;
