const FinanceTracker = require("../models/FinanceTracker");
const { validateFinancePayload } = require("../utils/validation");

const financeTrackerController = {
  create: async (req, res) => {
    try {
      const { type, amount, category, description, source } = req.body;
      const validation = validateFinancePayload({ type, amount, description });

      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
      }

      const tracker = new FinanceTracker({
        userId: req.userId,
        type,
        amount,
        category,
        description,
        source,
      });
      await tracker.save();
      res.status(201).json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const trackers = await FinanceTracker.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json({ success: true, data: trackers });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const tracker = await FinanceTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      );
      if (!tracker) {
        return res.status(404).json({ success: false, message: "Finance tracker not found" });
      }
      res.json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const tracker = await FinanceTracker.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!tracker) {
        return res.status(404).json({ success: false, message: "Finance tracker not found" });
      }
      res.json({ success: true, message: "Finance tracker deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },
};

module.exports = financeTrackerController;
