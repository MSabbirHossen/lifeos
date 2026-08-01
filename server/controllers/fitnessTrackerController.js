const FitnessTracker = require("../models/FitnessTracker");
const { EXERCISES, EXERCISE_MAP } = require("../constants/exercises");

const DEFAULT_SECONDS_PER_REP = 4;
const DEFAULT_REST_SECONDS_BETWEEN_SETS = 45;

const estimateDurationFromSetsReps = (sets, reps) => {
  const safeSets = Number(sets) || 0;
  const safeReps = Number(reps) || 0;

  if (safeSets <= 0 || safeReps <= 0) {
    return 0;
  }

  const activeSeconds = safeSets * safeReps * DEFAULT_SECONDS_PER_REP;
  const restSeconds =
    Math.max(safeSets - 1, 0) * DEFAULT_REST_SECONDS_BETWEEN_SETS;

  return Math.round((activeSeconds + restSeconds) / 60);
};

const calculateCalories = (met, bodyWeightKg, durationMinutes) => {
  const safeMet = Number(met) || 0;
  const safeBodyWeight = Number(bodyWeightKg) || 0;
  const safeDuration = Number(durationMinutes) || 0;

  if (safeMet <= 0 || safeBodyWeight <= 0 || safeDuration <= 0) {
    return 0;
  }

  return Math.round(((safeMet * 3.5 * safeBodyWeight) / 200) * safeDuration);
};

const hydrateTrackerPayload = (payload) => {
  const exerciseMeta = payload.exerciseId
    ? EXERCISE_MAP[payload.exerciseId]
    : null;
  const calculationMethod =
    payload.calculationMethod || exerciseMeta?.calculationMethod || "duration";
  const resolvedDuration =
    Number(payload.duration) > 0
      ? Number(payload.duration)
      : calculationMethod === "sets_reps"
        ? estimateDurationFromSetsReps(payload.sets, payload.reps)
        : 0;
  const resolvedMet = Number(payload.met) || Number(exerciseMeta?.met) || 0;
  const resolvedCalories = calculateCalories(
    resolvedMet,
    payload.weight,
    resolvedDuration,
  );

  return {
    ...payload,
    exercise: payload.exercise || exerciseMeta?.name || payload.exercise,
    type:
      payload.type ||
      payload.workoutType ||
      exerciseMeta?.workoutType ||
      "cardio",
    category: payload.category || exerciseMeta?.category || "",
    workoutType: payload.workoutType || exerciseMeta?.workoutType || "",
    equipment: payload.equipment || exerciseMeta?.equipment || "",
    targetMuscles: payload.targetMuscles || exerciseMeta?.targetMuscles || [],
    met: resolvedMet,
    calculationMethod,
    duration: resolvedDuration,
    caloriesBurned:
      Number(payload.caloriesBurned) > 0
        ? Number(payload.caloriesBurned)
        : resolvedCalories,
    sets: Number(payload.sets) || 0,
    reps: Number(payload.reps) || 0,
  };
};

const fitnessTrackerController = {
  listExercises: async (_req, res) => {
    res.json(EXERCISES);
  },

  create: async (req, res) => {
    try {
      const payload = hydrateTrackerPayload(req.body);
      const tracker = new FitnessTracker({
        userId: req.userId,
        exercise: payload.exercise,
        exerciseId: payload.exerciseId,
        type: payload.type,
        category: payload.category,
        workoutType: payload.workoutType,
        equipment: payload.equipment,
        targetMuscles: payload.targetMuscles,
        met: payload.met,
        calculationMethod: payload.calculationMethod,
        duration: payload.duration,
        caloriesBurned: payload.caloriesBurned,
        weight: payload.weight,
        sets: payload.sets,
        reps: payload.reps,
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
      const payload = hydrateTrackerPayload(req.body);
      const tracker = await FitnessTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        payload,
        { new: true },
      );
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Fitness tracker not found" });
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
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = fitnessTrackerController;
