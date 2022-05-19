const { Schema, model } = require("mongoose");
const { nested } = require("../utils/mongooseUtils");

const User = model(
  "User",
  new Schema(
    {
      __v: { type: Number, select: false },
      username: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
      },
      statut: {
        type: String,
        index: true,
        default: "en attente",
        enum: ["en attente", "confirmé", "activé", "non concerné"],
      },
      isAdmin: {
        type: Boolean,
        default: false,
        description: "true si l'utilisateur est administrateur",
      },
      unsubscribe: {
        type: Boolean,
        default: false,
      },
      email: {
        type: String,
      },
      anciens_emails: {
        type: [
          nested({
            email: {
              type: String,
              required: true,
            },
            modification_date: {
              type: Date,
              required: true,
            },
            auteur: {
              type: String,
              required: true,
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
      _meta: {
        default: {},
        type: nested({
          countConfirmationLinkClick: {
            type: Number,
            // default: 0,
          },
        }),
      },
    },
    { discriminatorKey: "type" }
  ),
  "users"
);

module.exports = User;
