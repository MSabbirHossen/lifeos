const Journal = require("../models/Journal");
const { validateJournalPayload } = require("../utils/validation");

const journalController = {
  create: async (req, res) => {
    try {
      const validation = validateJournalPayload(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const {
        title,
        mood,
        activities,
        highlights,
        notes,
        images,
        reflectionQuestion,
      } = req.body;
      const journal = new Journal({
        userId: req.userId,
        title,
        mood,
        activities,
        highlights,
        notes,
        images,
        reflectionQuestion: reflectionQuestion
          ? {
              questionId: reflectionQuestion.questionId || null,
              text: reflectionQuestion.text || "",
              category: reflectionQuestion.category || "",
            }
          : undefined,
      });
      await journal.save();
      res.status(201).json(journal);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const journals = await Journal.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json(journals);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const journal = await Journal.findById(req.params.id);
      if (!journal || journal.userId.toString() !== req.userId) {
        return res.status(404).json({ message: "Journal not found" });
      }
      res.json(journal);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const journal = await Journal.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true },
      );
      if (!journal) {
        return res
          .status(404)
          .json({ success: false, message: "Journal not found" });
      }
      res.json({ success: true, data: journal });
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
      const journal = await Journal.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!journal) {
        return res
          .status(404)
          .json({ success: false, message: "Journal not found" });
      }
      res.json({ success: true, message: "Journal deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = journalController;
