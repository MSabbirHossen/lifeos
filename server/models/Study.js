const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    enum: [
      "Web Dev",
      "Cybersecurity",
      "OSINT",
      "Arabic",
      "Islamic Studies",
      "IT Skills",
    ],
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  duration: Number,
  notes: String,
  resources: [String],
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Study", studySchema);
