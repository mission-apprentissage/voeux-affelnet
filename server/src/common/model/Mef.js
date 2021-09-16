const { Schema, model } = require("mongoose");

module.exports = model(
  "Mef",
  new Schema({
    mef: {
      type: String,
      unique: true,
      index: true,
      description: "Code MEF de la formation",
    },
    code_formation_diplome: {
      type: String,
      required: true,
      description: "Code diplome de la formation",
    },
    libelle_long: {
      type: String,
      required: true,
    },
  }),
  "mefs"
);
