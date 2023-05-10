const { Schema } = require("mongoose");
const { academieSchema } = require("./schemas/academieSchema");
const { historySchema } = require("./schemas/responsableHistorySchema");
const User = require("./User");
const { nested } = require("../utils/mongooseUtils");
const { UserType } = require("../constants/UserType");

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
        siret: {
          type: String,
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

  histories: {
    default: [],
    type: [historySchema],
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

const Gestionnaire = User.discriminator(UserType.GESTIONNAIRE, schema);

module.exports = Gestionnaire;
