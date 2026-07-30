const mongoose = require("mongoose");

const timeTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Study", "Fitness", "Islamic", "Work", "Social", "Sleep"],
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
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TimeTracker", timeTrackerSchema);
