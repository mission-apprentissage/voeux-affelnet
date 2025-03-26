const { Schema } = require("mongoose");
// const { nested } = require("../utils/mongooseUtils");
const { USER_TYPE } = require("../constants/UserType");
const { academieSchema } = require("./schemas/academieSchema");
const { historySchema: historyResponsableSchema } = require("./schemas/responsableHistorySchema");
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
    // required: true,
    index: true,
    // unique: true,
  },

  raison_sociale: {
    type: String,
  },

  enseigne: {
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

  histories: {
    default: [],
    type: [historyResponsableSchema],
  },

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

const Etablissement = User.discriminator(USER_TYPE.ETABLISSEMENT, schema);

module.exports = Etablissement;
