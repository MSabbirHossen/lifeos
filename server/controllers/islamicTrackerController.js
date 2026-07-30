const IslamicTracker = require("../models/IslamicTracker");

const islamicTrackerController = {
  create: async (req, res) => {
    try {
      const { salah, quranPages, hadithNotes, adhkar } = req.body;
      const tracker = new IslamicTracker({
        userId: req.userId,
        salah,
        quranPages,
        hadithNotes,
        adhkar,
      });
      await tracker.save();
      res.status(201).json(tracker);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const trackers = await IslamicTracker.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json(trackers);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const tracker = await IslamicTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      );
      if (!tracker) {
        return res.status(404).json({ success: false, message: "Islamic tracker not found" });
      }
      res.json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const tracker = await IslamicTracker.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!tracker) {
        return res.status(404).json({ success: false, message: "Islamic tracker not found" });
      }
      res.json({ success: true, message: "Islamic tracker deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },
};

module.exports = islamicTrackerController;
