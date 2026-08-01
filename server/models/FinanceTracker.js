const mongoose = require("mongoose");

const financeTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  transactionType: {
    type: String,
    enum: ["expense", "income", "transfer"],
    default: "expense",
  },
  type: {
    type: String,
    enum: ["expense", "income", "transfer"],
    default: "expense",
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
  transactionName: String,
  expenseName: String,
  incomeSource: String,
  description: String,
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "Bank", "Mobile Payment", "Mobile Banking"],
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
  if (!this.transactionType && this.type) {
    this.transactionType = this.type;
  }

  if (!this.type && this.transactionType) {
    this.type = this.transactionType;
  }

  if (!this.transactionType) {
    this.transactionType = "expense";
  }

  if (!this.type) {
    this.type = this.transactionType;
  }

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

  if (!this.expenseName && this.transactionType === "expense") {
    this.expenseName = this.transactionName || this.description;
  }

  if (!this.incomeSource && this.transactionType === "income") {
    this.incomeSource = this.source || this.transactionName || this.description;
  }

  if (!this.transactionName) {
    this.transactionName =
      this.expenseName || this.incomeSource || this.description;
  }

  next();
});

financeTrackerSchema.index({ userId: 1, type: 1, date: -1 });
financeTrackerSchema.index({ userId: 1, transactionType: 1, date: -1 });
financeTrackerSchema.index({ userId: 1, expenseName: 1 });
financeTrackerSchema.index({ userId: 1, incomeSource: 1 });

module.exports = mongoose.model("FinanceTracker", financeTrackerSchema);
