const mongoose = require("mongoose");

const islamicTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  salah: {
    fajr: Boolean,
    dhuhr: Boolean,
    asr: Boolean,
    maghrib: Boolean,
    isha: Boolean,
  },
  quranPages: {
    type: Number,
    default: 0,
  },
  hadithNotes: String,
  adhkar: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("IslamicTracker", islamicTrackerSchema);
