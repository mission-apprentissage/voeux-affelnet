const { Schema, model } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");
const { historySchema } = require("./schemas/relationHistorySchema");
const { DOWNLOAD_TYPE } = require("../constants/DownloadType");
const { academieSchema } = require("./schemas/academieSchema");

const schema = new Schema({
  etablissement_responsable: {
    required: true,
    default: null,
    type: nested({
      siret: {
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
      siret: {
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
          refPath: "USER_TYPE",
        },
        DOWNLOAD_TYPE: {
          type: String,
          required: true,
          enum: Object.values(DOWNLOAD_TYPE),
        },
      }),
    ],
  },

  emails: {
    type: [
      nested({
        token: {
          type: String,
          required: true,
          index: true,
        },
        templateName: {
          type: String,
          index: true,
          required: true,
        },
        sendDates: {
          type: [Date],
          required: true,
        },
        openDate: {
          type: Date,
        },
        messageIds: {
          type: [String],
        },
        error: {
          type: nested({
            type: {
              type: String,
              index: true,
              enum: ["fatal", "soft_bounce", "hard_bounce", "complaint", "invalid_email", "blocked", "error"],
            },
            message: {
              type: String,
            },
          }),
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
    "etablissement_responsable.siret": "text",
    "etablissement_formateur.siret": "text",
    "academie.code": "text",
  },
  { default_language: "french" }
);

const Relation = model("Relation", schema, "relations");

module.exports = Relation;
