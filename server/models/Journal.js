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
    enum: ["happy", "sad", "neutral", "excited", "anxious", "calm"],
  },
  activities: [String],
  highlights: String,
  notes: String,
  images: [String],
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Journal", journalSchema);
