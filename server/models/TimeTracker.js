const mongoose = require("mongoose");

const timeTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
      },
      name: {
        type: String,
        required: true,
      },
      normalizedName: {
        type: String,
        required: true,
      },
    },
    category: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

timeTrackerSchema.index({ userId: 1, startTime: -1 });
timeTrackerSchema.index({ userId: 1, "task.normalizedName": 1 });
timeTrackerSchema.index({ userId: 1, category: 1, startTime: -1 });

module.exports = mongoose.model("TimeTracker", timeTrackerSchema);
