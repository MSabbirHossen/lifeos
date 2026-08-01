const Task = require("../models/Task");
const timeTrackerCategories = require("../data/timeTrackerCategories");
const { validateTaskPayload } = require("../utils/validation");
const {
  formatTaskName,
  normalizeTaskName,
} = require("../utils/timeTracker");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const taskController = {
  search: async (req, res) => {
    try {
      const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

      if (!query) {
        const recent = await Task.find({ userId: req.userId })
          .sort({ lastUsed: -1, name: 1 })
          .limit(10);

        return res.json({ success: true, data: recent });
      }

      const normalizedQuery = normalizeTaskName(query);
      const tasks = await Task.find({
        userId: req.userId,
        normalizedName: new RegExp(`^${escapeRegex(normalizedQuery)}`),
      })
        .sort({ lastUsed: -1, name: 1 })
        .limit(8);

      return res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  create: async (req, res) => {
    try {
      const validation = validateTaskPayload(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const name = formatTaskName(req.body.name);
      const normalizedName = normalizeTaskName(req.body.name);
      const category = req.body.category || timeTrackerCategories[0].name;

      let task = await Task.findOne({ userId: req.userId, normalizedName });

      if (task) {
        task.name = name;
        task.category = category;
        task.lastUsed = new Date();
        await task.save();
      } else {
        task = new Task({
          userId: req.userId,
          name,
          normalizedName,
          category,
          lastUsed: new Date(),
        });
        await task.save();
      }

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      if (error.code === 11000) {
        const task = await Task.findOne({
          userId: req.userId,
          normalizedName: normalizeTaskName(req.body.name),
        });

        if (task) {
          task.lastUsed = new Date();
          await task.save();
          return res.json({ success: true, data: task });
        }
      }

      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  recent: async (req, res) => {
    try {
      const tasks = await Task.find({ userId: req.userId })
        .sort({ lastUsed: -1, name: 1 })
        .limit(10);

      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = taskController;