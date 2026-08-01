const mongoose = require("mongoose");

const salahBacklogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    completedDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    wasFastingOnStartDate: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

salahBacklogSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("SalahBacklog", salahBacklogSchema);
