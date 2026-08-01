const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    normalizedName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });
taskSchema.index({ userId: 1, lastUsed: -1 });
taskSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model("Task", taskSchema);
