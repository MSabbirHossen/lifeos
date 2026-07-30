const TimeTracker = require("../models/TimeTracker");
const { validateTimeTrackerPayload } = require("../utils/validation");

const timeTrackerController = {
  create: async (req, res) => {
    try {
      const { task, category, startTime, endTime } = req.body;
      const validation = validateTimeTrackerPayload({
        task,
        category,
        startTime,
        endTime,
      });

      if (!validation.isValid) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation failed",
            errors: validation.errors,
          });
      }

      const duration = Math.floor(
        (new Date(endTime) - new Date(startTime)) / 60000,
      );

      const timeTracker = new TimeTracker({
        userId: req.userId,
        task,
        category,
        startTime,
        endTime,
        duration,
      });
      await timeTracker.save();
      res.status(201).json({ success: true, data: timeTracker });
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

  getAll: async (req, res) => {
    try {
      const trackers = await TimeTracker.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json({ success: true, data: trackers });
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

  update: async (req, res) => {
    try {
      const tracker = await TimeTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true },
      );
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Tracker not found" });
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
      const tracker = await TimeTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Tracker not found" });
      }
      res.json({ success: true, message: "Tracker deleted" });
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

module.exports = timeTrackerController;
