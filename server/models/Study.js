const mongoose = require("mongoose");

const studySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySubject",
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedSubject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedTopic: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    resources: {
      type: [String],
      default: [],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

studySchema.index({ userId: 1, date: -1 });
studySchema.index({ userId: 1, normalizedSubject: 1, date: -1 });
studySchema.index({ userId: 1, subjectId: 1, normalizedTopic: 1, date: -1 });

module.exports = mongoose.model("Study", studySchema);
