const { Schema, model } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const { historySchema } = require("./schemas/relationHistorySchema");
const { DownloadType } = require("../constants/DownloadType");
const { academieSchema } = require("./schemas/academieSchema");

const schema = new Schema({
  etablissement_responsable: {
    required: true,
    default: null,
    type: nested({
      uai: {
        type: String,
        required: true,
        index: true,
      },
    }),
  },

  etablissement_formateur: {
    required: true,
    default: null,
    type: nested({
      uai: {
        type: String,
        required: true,
        index: true,
      },
    }),
  },

  academie: {
    type: academieSchema,
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

        user: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: "userType",
        },
        downloadType: {
          type: String,
          required: true,
          enum: Object.values(DownloadType),
        },
      }),
    ],
  },

  histories: {
    default: [],
    type: [historySchema],
  },

  nombre_voeux: {
    type: Number,
    default: 0,
  },

  nombre_voeux_restant: {
    type: Number,
    default: 0,
  },

  first_date_voeux: {
    type: Date,
    default: null,
  },

  last_date_voeux: {
    type: Date,
    default: null,
  },
});

schema.index(
  {
    "etablissement_responsable.uai": "text",
    "etablissement_formateur.uai": "text",
    "academie.code": "text",
  },
  { default_language: "french" }
);

const Relation = model("Relation", schema, "relations");

module.exports = Relation;
