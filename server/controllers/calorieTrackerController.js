const CalorieTracker = require("../models/CalorieTracker");

const toSafeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeTrackerPayload = (payload = {}) => {
  const calories = toSafeNumber(payload.calories, 0);
  const macros = {
    protein: toSafeNumber(payload?.macros?.protein, 0),
    carbs: toSafeNumber(payload?.macros?.carbs, 0),
    fats: toSafeNumber(payload?.macros?.fats, 0),
  };

  const nutritionSnapshotInput = payload.nutritionSnapshot || {};
  const nutritionSnapshot = {
    calories: toSafeNumber(nutritionSnapshotInput.calories, calories),
    protein: toSafeNumber(nutritionSnapshotInput.protein, macros.protein),
    carbs: toSafeNumber(nutritionSnapshotInput.carbs, macros.carbs),
    fat: toSafeNumber(
      nutritionSnapshotInput.fat,
      nutritionSnapshotInput.fats ?? macros.fats,
    ),
    fiber: toSafeNumber(nutritionSnapshotInput.fiber, 0),
    per100g: {
      calories: toSafeNumber(nutritionSnapshotInput?.per100g?.calories, 0),
      protein: toSafeNumber(nutritionSnapshotInput?.per100g?.protein, 0),
      carbs: toSafeNumber(nutritionSnapshotInput?.per100g?.carbs, 0),
      fat: toSafeNumber(nutritionSnapshotInput?.per100g?.fat, 0),
      fiber: toSafeNumber(nutritionSnapshotInput?.per100g?.fiber, 0),
    },
  };

  const normalized = {
    mealType: payload.mealType,
    foodName: payload.foodName,
    foodId: payload.foodId || "",
    foodCategory: payload.foodCategory || "",
    consumedWeight: toSafeNumber(payload.consumedWeight, 0),
    servingMultiplier: toSafeNumber(payload.servingMultiplier, 1),
    calories,
    macros,
    waterIntake: toSafeNumber(payload.waterIntake, 0),
    nutritionSnapshot,
  };

  if (payload.date) {
    normalized.date = payload.date;
  }

  return normalized;
};

const calorieTrackerController = {
  create: async (req, res) => {
    try {
      const normalizedPayload = normalizeTrackerPayload(req.body);
      const tracker = new CalorieTracker({
        userId: req.userId,
        ...normalizedPayload,
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
      const existingTracker = await CalorieTracker.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!existingTracker) {
        return res
          .status(404)
          .json({ success: false, message: "Calorie tracker not found" });
      }

      const mergedPayload = {
        ...existingTracker.toObject(),
        ...req.body,
        macros: {
          ...(existingTracker.macros || {}),
          ...(req.body.macros || {}),
        },
        nutritionSnapshot: {
          ...(existingTracker.nutritionSnapshot || {}),
          ...(req.body.nutritionSnapshot || {}),
          per100g: {
            ...(existingTracker.nutritionSnapshot?.per100g || {}),
            ...(req.body.nutritionSnapshot?.per100g || {}),
          },
        },
      };

      const normalizedPayload = normalizeTrackerPayload(mergedPayload);

      const tracker = await CalorieTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        normalizedPayload,
        { new: true },
      );

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
