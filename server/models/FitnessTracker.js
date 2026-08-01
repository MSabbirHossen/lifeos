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
    enum: ["cardio", "strength", "flexibility", "sports", "freehand", "gym"],
    required: true,
  },
  category: {
    type: String,
    default: "",
  },
  workoutType: {
    type: String,
    default: "",
  },
  equipment: {
    type: String,
    default: "",
  },
  targetMuscles: {
    type: [String],
    default: [],
  },
  met: {
    type: Number,
    default: 0,
  },
  calculationMethod: {
    type: String,
    default: "",
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
