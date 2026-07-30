const mongoose = require("mongoose");

const financeTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["expense", "income"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: String,
  description: String,
  source: String,
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FinanceTracker", financeTrackerSchema);
