const mongoose = require("mongoose");

const journalQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subCategory: {
    type: String,
    default: "",
    trim: true,
  },
  difficulty: {
    type: String,
    default: "medium",
    trim: true,
  },
  targetAudience: {
    type: String,
    default: "student",
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

journalQuestionSchema.index({ question: 1, category: 1 }, { unique: true });
journalQuestionSchema.index({ isActive: 1, category: 1, difficulty: 1 });
journalQuestionSchema.index({ targetAudience: 1, category: 1 });

module.exports = mongoose.model("JournalQuestion", journalQuestionSchema);
