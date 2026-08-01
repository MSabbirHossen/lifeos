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
  foodId: {
    type: String,
    default: "",
  },
  foodCategory: {
    type: String,
    default: "",
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
  nutritionSnapshot: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    per100g: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
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
