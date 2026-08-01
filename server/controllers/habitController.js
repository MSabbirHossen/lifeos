const HabitTemplate = require("../models/HabitTemplate");
const UserHabit = require("../models/UserHabit");
const {
  normalizeName,
  initializeDefaultHabitsForUser,
  getUserHabitsWithTodayState,
  searchHabits,
  upsertHabitLog,
  getHabitStats,
} = require("../services/habitService");

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return defaultValue;
};

const habitController = {
  initialize: async (req, res) => {
    try {
      const activeCount = await initializeDefaultHabitsForUser(req.userId);
      res.json({
        success: true,
        message: "Default habits initialized",
        data: { activeHabits: activeCount },
      });
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
      const {
        habitTemplateId,
        habitName,
        name,
        category,
        icon,
        frequency,
        description,
      } = req.body;

      const finalName = (habitName || name || "").trim();
      if (!finalName) {
        return res.status(400).json({
          success: false,
          message: "habit name is required",
        });
      }

      const nameNormalized = normalizeName(finalName);

      let template = null;
      if (habitTemplateId) {
        template = await HabitTemplate.findById(habitTemplateId);
      }

      if (!template) {
        template = await HabitTemplate.findOne({ nameNormalized });
      }

      if (!template) {
        template = await HabitTemplate.create({
          name: finalName,
          nameNormalized,
          category: category || "General",
          icon: icon || "✅",
          description: description || "",
          frequency: frequency || "Daily",
          default: false,
        });
      }

      const existingUserHabit = await UserHabit.findOne({
        userId: req.userId,
        nameNormalized: template.nameNormalized,
      });

      if (existingUserHabit) {
        if (!existingUserHabit.active) {
          existingUserHabit.active = true;
          await existingUserHabit.save();
        }

        return res.status(200).json({
          success: true,
          message: `${template.name} already exists`,
          data: existingUserHabit,
          duplicate: true,
        });
      }

      const userHabit = await UserHabit.create({
        userId: req.userId,
        habitTemplateId: template._id,
        name: template.name,
        nameNormalized: template.nameNormalized,
        category: template.category,
        icon: template.icon,
        frequency: template.frequency,
        custom: !template.default,
        active: true,
      });

      const views = await getUserHabitsWithTodayState(req.userId, {
        includeInactive: true,
      });
      const createdView = views.find(
        (item) => String(item._id) === String(userHabit._id),
      );

      res.status(201).json({
        success: true,
        message: "Habit created",
        data: createdView || userHabit,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getAll: async (req, res) => {
    try {
      await initializeDefaultHabitsForUser(req.userId);
      const habits = await getUserHabitsWithTodayState(req.userId, {
        includeInactive: true,
      });
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getTemplates: async (req, res) => {
    try {
      const templates = await HabitTemplate.find({ default: true }).sort({
        createdAt: 1,
      });
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  search: async (req, res) => {
    try {
      const q = req.query.q || "";
      const results = await searchHabits(req.userId, q, 12);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const habit = await UserHabit.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!habit) {
        return res
          .status(404)
          .json({ success: false, message: "Habit not found" });
      }

      const updates = {};
      if (req.body.name || req.body.habitName) {
        const nextName = (req.body.name || req.body.habitName || "").trim();
        if (!nextName) {
          return res
            .status(400)
            .json({ success: false, message: "habit name cannot be empty" });
        }
        updates.name = nextName;
        updates.nameNormalized = normalizeName(nextName);
      }

      ["category", "icon", "frequency"].forEach((field) => {
        if (typeof req.body[field] === "string") {
          updates[field] = req.body[field].trim();
        }
      });

      if (typeof req.body.active !== "undefined") {
        updates.active = parseBoolean(req.body.active, habit.active);
      }

      await UserHabit.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: updates },
        { new: true },
      );

      if (typeof req.body.status !== "undefined") {
        const completed = parseBoolean(req.body.status, false);
        await upsertHabitLog({
          userId: req.userId,
          habitId: req.params.id,
          completed,
          date: req.body.date ? new Date(req.body.date) : new Date(),
          notes: req.body.notes || "",
        });
      }

      const habits = await getUserHabitsWithTodayState(req.userId, {
        includeInactive: true,
      });
      const updated = habits.find((item) => String(item._id) === req.params.id);

      res.json({ success: true, data: updated || null });
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
      const habit = await UserHabit.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!habit) {
        return res
          .status(404)
          .json({ success: false, message: "Habit not found" });
      }
      res.json({ success: true, message: "Habit deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  logToday: async (req, res) => {
    try {
      const habit = await UserHabit.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!habit) {
        return res
          .status(404)
          .json({ success: false, message: "Habit not found" });
      }

      const completed = parseBoolean(req.body.completed, true);
      const log = await upsertHabitLog({
        userId: req.userId,
        habitId: habit._id,
        completed,
        notes: req.body.notes || "",
      });

      res.json({ success: true, data: log });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  stats: async (req, res) => {
    try {
      const data = await getHabitStats(req.userId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = habitController;
