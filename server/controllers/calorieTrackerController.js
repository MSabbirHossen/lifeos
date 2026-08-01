const CalorieTracker = require("../models/CalorieTracker");

const calorieTrackerController = {
  create: async (req, res) => {
    try {
      const {
        mealType,
        foodName,
        consumedWeight,
        servingMultiplier,
        calories,
        macros,
        waterIntake,
      } = req.body;
      const tracker = new CalorieTracker({
        userId: req.userId,
        mealType,
        foodName,
        consumedWeight,
        servingMultiplier,
        calories,
        macros,
        waterIntake,
      });
      await tracker.save();
      res.status(201).json(tracker);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const trackers = await CalorieTracker.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json(trackers);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const tracker = await CalorieTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true },
      );
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Calorie tracker not found" });
      }
      res.json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  delete: async (req, res) => {
    try {
      const tracker = await CalorieTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Calorie tracker not found" });
      }
      res.json({ success: true, message: "Calorie tracker deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = calorieTrackerController;
