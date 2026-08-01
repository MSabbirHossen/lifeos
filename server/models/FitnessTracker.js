const mongoose = require("mongoose");

const fitnessTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  exercise: {
    type: String,
    required: true,
  },
  exerciseId: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    enum: ["cardio", "strength", "flexibility", "sports"],
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  caloriesBurned: Number,
  weight: Number,
  sets: {
    type: Number,
    default: 0,
  },
  reps: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FitnessTracker", fitnessTrackerSchema);
