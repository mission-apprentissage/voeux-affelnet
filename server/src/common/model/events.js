const { Schema, model } = require("mongoose");

const Event = model(
  "Event",
  new Schema(
    {
      __v: { type: Number, select: false },
      date: {
        type: Date,
        default: () => new Date(),
      },
    },
    { discriminatorKey: "type" }
  ),
  "events"
);

const JobEvent = Event.discriminator(
  "JobEvent",
  new Schema({
    job: {
      type: String,
      required: true,
    },
    stats: {
      type: Schema.Types.Mixed,
    },
  })
);

module.exports = { Event, JobEvent };
