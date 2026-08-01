const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },
  dashboardPreferences: {
    weights: {
      islamic: { type: Number },
      health: { type: Number },
      fitness: { type: Number },
      study: { type: Number },
      habits: { type: Number },
      finance: { type: Number },
      journal: { type: Number },
    },
    currency: {
      type: String,
      enum: ["BDT", "USD", "SAR"],
      default: "BDT",
    },
    layout: {
      type: String,
      enum: ["compact", "balanced", "detailed"],
      default: "balanced",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
