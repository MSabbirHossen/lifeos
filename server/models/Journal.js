const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    enum: [
      "happy",
      "sad",
      "neutral",
      "excited",
      "anxious",
      "calm",
      "motivated",
      "stressed",
      "grateful",
    ],
  },
  activities: [String],
  highlights: String,
  notes: String,
  images: [String],
  reflectionQuestion: {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalQuestion",
      default: null,
    },
    text: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
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

journalSchema.index({ userId: 1, "reflectionQuestion.category": 1, date: -1 });
journalSchema.index({ userId: 1, "reflectionQuestion.questionId": 1 });

module.exports = mongoose.model("Journal", journalSchema);
