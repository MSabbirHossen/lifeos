const mongoose = require("mongoose");

const studySubjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

studySubjectSchema.index(
  { userId: 1, normalizedName: 1 },
  { unique: true, name: "study_subject_unique_name" },
);
studySubjectSchema.index({ userId: 1, archived: 1, updatedAt: -1 });

module.exports = mongoose.model("StudySubject", studySubjectSchema);
