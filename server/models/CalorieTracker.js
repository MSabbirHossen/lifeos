const mongoose = require("mongoose");

const calorieTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    required: true,
  },
  foodName: {
    type: String,
    required: true,
  },
  consumedWeight: {
    type: Number,
    default: 0,
  },
  servingMultiplier: {
    type: Number,
    default: 1,
  },
  calories: {
    type: Number,
    required: true,
  },
  macros: {
    protein: Number,
    carbs: Number,
    fats: Number,
  },
  waterIntake: {
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

module.exports = mongoose.model("CalorieTracker", calorieTrackerSchema);
