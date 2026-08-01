const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySubject",
      required: true,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    totalTopics: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTopics: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

studyPlanSchema.index(
  { userId: 1, subjectId: 1 },
  { unique: true, name: "study_plan_unique_subject" },
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
