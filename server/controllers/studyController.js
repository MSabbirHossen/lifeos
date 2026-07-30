const Study = require("../models/Study");

const studyController = {
  create: async (req, res) => {
    try {
      const { subject, topic, duration, notes, resources } = req.body;
      const study = new Study({
        userId: req.userId,
        subject,
        topic,
        duration,
        notes,
        resources,
      });
      await study.save();
      res.status(201).json(study);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const studies = await Study.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json(studies);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const study = await Study.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      );
      if (!study) {
        return res.status(404).json({ success: false, message: "Study record not found" });
      }
      res.json({ success: true, data: study });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const study = await Study.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!study) {
        return res.status(404).json({ success: false, message: "Study record not found" });
      }
      res.json({ success: true, message: "Study deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },
};

module.exports = studyController;
