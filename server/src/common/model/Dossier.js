const { Schema, model } = require("mongoose");
const { nested } = require("../utils/mongooseUtils.js");
const { academieSchema } = require("./schemas/academieSchema.js");

const schema = new Schema({
  __v: { type: Number, select: false },
  dossier_id: {
    type: String,
    index: true,
    required: true,
  },
  uai_etablissement: {
    type: String,
    index: true,
    required: true,
    sparse: true,
  },
  formation_cfd: {
    type: String,
    index: true,
    required: true,
  },
  ine_apprenant: {
    type: String,
    index: true,
  },
  email_contact: {
    type: String,
    index: true,
  },
  annee_formation: {
    type: Number,
    index: true,
    required: true,
  },
  statut: {
    type: String,
    index: true,
    required: true,
    enum: ["inscrit", "apprenti", "abandon", "inconnu"],
  },
  nom_apprenant: String,
  prenom_apprenant: String,
  contrat_date_debut: Date,
  contrat_date_fin: Date,
  contrat_date_rupture: Date,
  academie: {
    required: true,
    type: academieSchema,
  },
  _meta: {
    required: true,
    type: nested({
      import_dates: {
        required: true,
        index: true,
        type: [Date],
      },
      nom_complet: {
        type: String,
        index: true,
      },
    }),
  },
});

module.exports = model("Dossier", schema, "dossiers");
