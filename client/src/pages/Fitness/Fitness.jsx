import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";
import { EXERCISE_DATASET } from "../../data/exercises";
import {
  calculateWorkoutCalories,
  calculateWorkoutCaloriesFromSetsReps,
} from "../../utils/workoutCalculator";

const categoryToWorkoutType = {
  "Freehand & Bodyweight": "strength",
  "Gym & Weight Training": "strength",
  "Cardio Equipment": "cardio",
};

const Fitness = () => {
  const [trackers, setTrackers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [helperDurationMinutes, setHelperDurationMinutes] = useState(0);
  const [formData, setFormData] = useState({
    exerciseId: "",
    exercise: "",
    type: "cardio",
    duration: 0,
    sets: 0,
    reps: 0,
    caloriesBurned: 0,
    weight: 0,
  });

  const hasDurationInput = Number(formData.duration) > 0;
  const hasSetRepInput = Number(formData.sets) > 0 || Number(formData.reps) > 0;

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      const { data } = await API.get("/fitness");
      setTrackers(data);
    } catch (error) {
      console.error("Error fetching fitness trackers:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/fitness", formData);
      setFormData({
        exerciseId: "",
        exercise: "",
        type: "cardio",
        duration: 0,
        sets: 0,
        reps: 0,
        caloriesBurned: 0,
        weight: 0,
      });
      setSelectedExercise(null);
      setHelperDurationMinutes(0);
      setIsModalOpen(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error creating fitness tracker:", error);
    }
  };

  const recalculateCalories = ({
    exerciseId,
    duration,
    sets,
    reps,
    weight,
  }) => {
    const safeDuration = Number(duration) || 0;
    const safeWeight = Number(weight) || 0;

    if (!exerciseId || safeWeight <= 0) {
      setHelperDurationMinutes(0);
      return 0;
    }

    if (safeDuration > 0) {
      setHelperDurationMinutes(0);
      return calculateWorkoutCalories(exerciseId, safeDuration, safeWeight);
    }

    const helperResult = calculateWorkoutCaloriesFromSetsReps(
      exerciseId,
      Number(sets) || 0,
      Number(reps) || 0,
      safeWeight,
    );
    setHelperDurationMinutes(helperResult.estimatedDurationMinutes);
    return helperResult.calories;
  };

  const resolveExerciseFromInput = (value) => {
    const normalizedInput = value.trim().toLowerCase();
    if (!normalizedInput) {
      return null;
    }

    const exactMatch = EXERCISE_DATASET.find(
      (exercise) => exercise.name.toLowerCase() === normalizedInput,
    );
    if (exactMatch) {
      return exactMatch;
    }

    const startsWithMatches = EXERCISE_DATASET.filter((exercise) =>
      exercise.name.toLowerCase().startsWith(normalizedInput),
    );
    if (startsWithMatches.length === 1) {
      return startsWithMatches[0];
    }

    const containsMatches = EXERCISE_DATASET.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedInput),
    );
    if (containsMatches.length === 1) {
      return containsMatches[0];
    }

    return null;
  };

  const handleExerciseChange = (value) => {
    const matchedExercise = resolveExerciseFromInput(value);

    if (!matchedExercise) {
      setSelectedExercise(null);
      setHelperDurationMinutes(0);
      setFormData((prev) => ({ ...prev, exerciseId: "", exercise: value }));
      return;
    }

    setSelectedExercise(matchedExercise);
    setFormData((prev) => {
      const next = {
        ...prev,
        exerciseId: matchedExercise.id,
        exercise: matchedExercise.name,
        type: categoryToWorkoutType[matchedExercise.category] || prev.type,
      };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleDurationChange = (value) => {
    const duration = Number(value) || 0;

    setFormData((prev) => {
      const next = {
        ...prev,
        duration,
        ...(duration > 0 ? { sets: 0, reps: 0 } : {}),
      };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleSetsChange = (value) => {
    const sets = Number(value) || 0;

    setFormData((prev) => {
      const next = {
        ...prev,
        sets,
        ...(sets > 0 ? { duration: 0 } : {}),
      };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleRepsChange = (value) => {
    const reps = Number(value) || 0;

    setFormData((prev) => {
      const next = {
        ...prev,
        reps,
        ...(reps > 0 ? { duration: 0 } : {}),
      };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleWeightChange = (value) => {
    const weight = Number(value) || 0;

    setFormData((prev) => {
      const next = { ...prev, weight };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/fitness/${id}`);
      fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
    }
  };

  const totalCalories = trackers.reduce(
    (sum, t) => sum + (t.caloriesBurned || 0),
    0,
  );
  const totalDuration = trackers.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fitness Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Log Workout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Workouts</p>
            <p className="text-3xl font-bold text-blue-500">
              {trackers.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Duration</p>
            <p className="text-3xl font-bold text-green-500">{totalDuration}</p>
            <p className="text-sm text-gray-500">minutes</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Calories Burned</p>
            <p className="text-3xl font-bold text-red-500">{totalCalories}</p>
            <p className="text-sm text-gray-500">kcal</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {trackers.map((tracker) => (
          <Card key={tracker._id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tracker.exercise}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-semibold capitalize">
                    {tracker.type}
                  </span>{" "}
                  - {new Date(tracker.date).toLocaleDateString()}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <p className="text-sm">
                    <strong>Duration:</strong> {tracker.duration} min
                  </p>
                  {tracker.sets > 0 && tracker.reps > 0 && (
                    <p className="text-sm">
                      <strong>Volume:</strong> {tracker.sets} x {tracker.reps}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Calories:</strong> {tracker.caloriesBurned}
                  </p>
                  {tracker.weight && (
                    <p className="text-sm">
                      <strong>Weight:</strong> {tracker.weight} kg
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(tracker._id)}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Log Workout"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * Required fields
          </p>
          <div>
            <label
              htmlFor="fitness-exercise"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Exercise Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fitness-exercise"
              type="text"
              list="fitness-exercise-options"
              value={formData.exercise}
              onChange={(e) => handleExerciseChange(e.target.value)}
              placeholder="Search exercise"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <datalist id="fitness-exercise-options">
              {EXERCISE_DATASET.map((exercise) => (
                <option
                  key={exercise.id}
                  value={exercise.name}
                  label={`${exercise.category} | ${exercise.intensity} | MET ${exercise.met}`}
                />
              ))}
            </datalist>
            {selectedExercise && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {selectedExercise.category} | {selectedExercise.intensity} | MET{" "}
                {selectedExercise.met}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="fitness-type"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Workout Type <span className="text-red-500">*</span>
            </label>
            <select
              id="fitness-type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="flexibility">Flexibility</option>
              <option value="sports">Sports</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="fitness-duration"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Duration (minutes)
            </label>
            <input
              id="fitness-duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              disabled={hasSetRepInput}
              placeholder="Enter direct workout time"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use either duration OR sets/reps. Clear sets/reps to enable
              duration.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="fitness-sets"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Sets
              </label>
              <input
                id="fitness-sets"
                type="number"
                value={formData.sets}
                onChange={(e) => handleSetsChange(e.target.value)}
                disabled={hasDurationInput}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="fitness-reps"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Reps
              </label>
              <input
                id="fitness-reps"
                type="number"
                value={formData.reps}
                onChange={(e) => handleRepsChange(e.target.value)}
                disabled={hasDurationInput}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="fitness-calories"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Calories Burned
            </label>
            <input
              id="fitness-calories"
              type="number"
              value={formData.caloriesBurned}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  caloriesBurned: Number(e.target.value) || 0,
                })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            {selectedExercise && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Calories Burned = MET x Weight in kg x (Duration in minutes /
                60).
                {helperDurationMinutes > 0
                  ? ` Estimated time from sets/reps: ${helperDurationMinutes} min.`
                  : ""}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="fitness-weight"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Body Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              id="fitness-weight"
              type="number"
              value={formData.weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fitness;
