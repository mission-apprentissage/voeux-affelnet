const { Schema } = require("mongoose");
const User = require("./User");
const { nested } = require("../utils/mongooseUtils");

let schema = new Schema({
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
  email_source: {
    type: String,
    enum: ["contact", "directeur"],
    default: "contact",
  },
  contacts: {
    type: [String],
    required: true,
    default: [],
  },
  voeux_date: {
    type: Date,
  },
  voeux_telechargements: {
    default: [],
    type: [
      nested({
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
  { uai: "text", siret: "text", raison_sociale: "text", "academie.nom": "text", email: "text", statut: "text" },
  { default_language: "french" }
);

const Cfa = User.discriminator("Cfa", schema);

module.exports = Cfa;
