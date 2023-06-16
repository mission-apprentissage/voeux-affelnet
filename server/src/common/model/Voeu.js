const { Schema, model } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const { academieSchema } = require("./schemas/academieSchema.js");

const schema = new Schema({
  __v: { type: Number, select: false },
  academie: {
    required: true,
    type: academieSchema,
  },
  apprenant: {
    required: true,
    type: nested({
      ine: {
        type: String,
        index: true,
      },
      nom: String,
      prenom: String,
      telephone_personnel: String,
      telephone_portable: String,
      adresse: {
        required: true,
        type: nested({
          libelle: {
            required: true,
            type: String,
          },
          ligne_1: String,
          ligne_2: String,
          ligne_3: String,
          ligne_4: String,
          code_postal: String,
          ville: String,
          pays: String,
        }),
      },
    }),
  },
  responsable: {
    required: true,
    type: nested({
      telephone_1: String,
      telephone_2: String,
      email_1: String,
      email_2: String,
    }),
  },
  formation: {
    required: true,
    type: nested({
      code_affelnet: {
        type: String,
        index: true,
      },
      code_formation_diplome: {
        type: String,
        index: true,
      },
      mef: String,
      libelle: String,
      cle_ministere_educatif: String,
    }),
  },
  etablissement_origine: {
    required: true,
    type: nested({
      uai: String,
      nom: String,
      ville: String,
      cio: String,
      academie: {
        required: true,
        type: academieSchema,
      },
    }),
  },
  etablissement_accueil: {
    required: true,
    type: nested({
      uai: {
        type: String,
        index: true,
      },
      nom: String,
      ville: String,
      cio: String,
      academie: {
        required: true,
        type: academieSchema,
      },
    }),
  },
  etablissement_formateur: {
    required: true,
    type: nested({
      uai: {
        type: String,
        index: true,
      },
    }),
  },
  etablissement_gestionnaire: {
    required: true,
    type: nested({
      siret: {
        type: String,
        index: true,
      },
    }),
  },
  _meta: {
    required: true,
    type: nested({
      jeune_uniquement_en_apprentissage: {
        type: Boolean,
        required: true,
        default: false,
      },
      import_dates: {
        required: true,
        index: true,
        type: [Date],
      },
      anomalies: {
        default: [],
        type: [
          nested({
            path: {
              type: Array,
              default: [],
            },
            type: {
              type: String,
            },
          }),
        ],
      },
    }),
  },
});

schema.index(
  { "academie.code": 1, "apprenant.ine": 1, "formation.code_affelnet": 1 },
  { name: "voeu_unique_identifier", unique: true }
);

module.exports = model("Voeu", schema, "voeux");
