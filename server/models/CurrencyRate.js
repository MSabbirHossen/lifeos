const mongoose = require("mongoose");

const currencyRateSchema = new mongoose.Schema({
  currency: {
    type: String,
    enum: ["SAR", "USD", "BDT"],
    required: true,
  },
  rateToBDT: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    default: "open.er-api.com",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

currencyRateSchema.index({ currency: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("CurrencyRate", currencyRateSchema);
