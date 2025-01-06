const { Schema } = require("mongoose");
// const { nested } = require("../utils/mongooseUtils");
const { UserType } = require("../constants/UserType");
const { academieSchema } = require("./schemas/academieSchema");
const { historySchema } = require("./schemas/responsableHistorySchema");
const User = require("./User");

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

  // etablissements_formateur: {
  //   required: true,
  //   default: [],
  //   type: [
  //     nested({
  //       uai: {
  //         type: String,
  //         required: true,
  //         index: true,
  //       },
  //       siret: {
  //         type: String,
  //         index: true,
  //       },
  //       diffusion_autorisee: {
  //         type: Boolean,
  //         default: false,
  //       },
  //       voeux_date: {
  //         type: Date,
  //       },
  //       nombre_voeux: {
  //         type: Number,
  //         default: 0,
  //       },
  //       academie: academieSchema,
  //     }),
  //   ],
  // },

  // voeux_telechargements_formateur: {
  //   default: [],
  //   type: [
  //     nested({
  //       uai: {
  //         type: String,
  //         required: true,
  //         index: true,
  //       },
  //       date: {
  //         type: Date,
  //         required: true,
  //         default: () => new Date(),
  //       },
  //     }),
  //   ],
  // },

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
    siret: "text",
    uai: "text",
    raison_sociale: "text",
    // "academie.nom": "text",
    email: "text",
    // statut: "text",
    // "etablissements_formateur.uai": "text",
  },
  { default_language: "french" }
);

const Responsable = User.discriminator(UserType.RESPONSABLE, schema);

module.exports = Responsable;
