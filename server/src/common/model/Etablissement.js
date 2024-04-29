const { Schema } = require("mongoose");
// const { nested } = require("../utils/mongooseUtils");
const { UserType } = require("../constants/UserType");
const { academieSchema } = require("./schemas/academieSchema");
// const { historySchema: historyResponsableSchema } = require("./schemas/responsableHistorySchema");
// const { historySchema: historyFormateurSchema } = require("./schemas/formateurHistorySchema");
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
    required: true,
    index: true,
    unique: true,
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

  academie: {
    type: academieSchema,
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
  //       email: {
  //         type: String,
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

  // histories_responsable: {
  //   default: [],
  //   type: [historyResponsableSchema],
  // },

  // etablissements_responsable: {
  //   required: true,
  //   default: [],
  //   type: [
  //     nested({
  //       siret: {
  //         type: String,
  //         required: true,
  //         index: true,
  //       },
  //       uai: {
  //         type: String,
  //         index: true,
  //       },
  //       email: {
  //         type: String,
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

  // voeux_telechargements_responsable: {
  //   default: [],
  //   type: [
  //     nested({
  //       siret: {
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

  // histories_formateur: {
  //   default: [],
  //   type: [historyFormateurSchema],
  // },
});

schema.index(
  {
    siret: "text",
    uai: "text",
    raison_sociale: "text",
    email: "text",
  },
  { default_language: "french" }
);

const Etablissement = User.discriminator(UserType.ETABLISSEMENT, schema);

module.exports = Etablissement;
