const Habit = require("../models/Habit");

const habitController = {
  create: async (req, res) => {
    try {
      const { habitName, category } = req.body;
      const habit = new Habit({
        userId: req.userId,
        habitName,
        category,
      });
      await habit.save();
      res.status(201).json(habit);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const habits = await Habit.find({ userId: req.userId }).sort({
        createdAt: -1,
      });
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const habit = await Habit.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      );
      if (!habit) {
        return res.status(404).json({ success: false, message: "Habit not found" });
      }
      res.json({ success: true, data: habit });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!habit) {
        return res.status(404).json({ success: false, message: "Habit not found" });
      }
      res.json({ success: true, message: "Habit deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },
};

module.exports = habitController;
