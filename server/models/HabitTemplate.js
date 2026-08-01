const mongoose = require("mongoose");

const habitTemplateSchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: "",
    trim: true,
  },
  frequency: {
    type: String,
    default: "Daily",
    trim: true,
  },
  default: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

habitTemplateSchema.index({ nameNormalized: 1 }, { unique: true });

module.exports = mongoose.model("HabitTemplate", habitTemplateSchema);
