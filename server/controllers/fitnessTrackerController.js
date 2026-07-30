const FitnessTracker = require("../models/FitnessTracker");

const fitnessTrackerController = {
  create: async (req, res) => {
    try {
      const { exercise, type, duration, caloriesBurned, weight } = req.body;
      const tracker = new FitnessTracker({
        userId: req.userId,
        exercise,
        type,
        duration,
        caloriesBurned,
        weight,
      });
      await tracker.save();
      res.status(201).json(tracker);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const trackers = await FitnessTracker.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json(trackers);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const tracker = await FitnessTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true },
      );
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Fitness tracker not found" });
      }
      res.json({ success: true, data: tracker });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  delete: async (req, res) => {
    try {
      const tracker = await FitnessTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Fitness tracker not found" });
      }
      res.json({ success: true, message: "Fitness tracker deleted" });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },
};

module.exports = fitnessTrackerController;
