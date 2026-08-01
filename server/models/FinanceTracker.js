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
  currency: {
    type: String,
    enum: ["BDT", "SAR", "USD"],
    default: "BDT",
  },
  exchangeRate: {
    type: Number,
    default: 1,
  },
  convertedAmountBDT: {
    type: Number,
    default: null,
  },
  category: String,
  subCategory: String,
  expenseName: String,
  description: String,
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "Bank", "Mobile Payment"],
  },
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

financeTrackerSchema.pre("save", function preSave(next) {
  if (this.currency == null || this.currency === "") {
    this.currency = "BDT";
  }

  if (
    this.exchangeRate == null ||
    Number.isNaN(this.exchangeRate) ||
    this.exchangeRate <= 0
  ) {
    this.exchangeRate = this.currency === "BDT" ? 1 : 1;
  }

  if (
    this.convertedAmountBDT == null ||
    Number.isNaN(this.convertedAmountBDT) ||
    this.convertedAmountBDT <= 0
  ) {
    this.convertedAmountBDT =
      Number(this.amount || 0) * Number(this.exchangeRate || 1);
  }

  if (!this.expenseName && this.description) {
    this.expenseName = this.description;
  }

  next();
});

financeTrackerSchema.index({ userId: 1, type: 1, date: -1 });
financeTrackerSchema.index({ userId: 1, expenseName: 1 });

module.exports = mongoose.model("FinanceTracker", financeTrackerSchema);
