const mongoose = require("mongoose");

const userHabitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  habitTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HabitTemplate",
    required: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  nameNormalized: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    default: "General",
    trim: true,
  },
  icon: {
    type: String,
    default: "✅",
    trim: true,
  },
  frequency: {
    type: String,
    default: "Daily",
    trim: true,
  },
  custom: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userHabitSchema.index({ userId: 1, nameNormalized: 1 }, { unique: true });
userHabitSchema.index(
  { userId: 1, habitTemplateId: 1 },
  {
    unique: true,
    partialFilterExpression: { habitTemplateId: { $exists: true } },
  },
);

module.exports = mongoose.model("UserHabit", userHabitSchema);
