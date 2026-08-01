import React, { useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_DATASET,
  EXERCISE_MAP,
} from "../../data/exercises";
import {
  calculateWorkoutCalories,
  calculateWorkoutCaloriesFromSetsReps,
} from "../../utils/workoutCalculator";
import WorkoutForm from "./components/WorkoutForm";
import WorkoutCard from "./components/WorkoutCard";
import FitnessStats from "./components/FitnessStats";
import WorkoutChart from "./components/WorkoutChart";
import { computeFitnessAnalytics } from "./fitnessAnalytics";

const defaultFormData = {
  exerciseId: "",
  exercise: "",
  type: "cardio",
  category: "",
  workoutType: "",
  equipment: "",
  targetMuscles: [],
  met: 0,
  calculationMethod: "duration",
  duration: 0,
  sets: 0,
  reps: 0,
  caloriesBurned: 0,
  weight: 0,
};

const Fitness = () => {
  const [trackers, setTrackers] = useState([]);
  const [exercises, setExercises] = useState(EXERCISE_DATASET);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [helperDurationMinutes, setHelperDurationMinutes] = useState(0);
  const [formData, setFormData] = useState(defaultFormData);

  const analytics = useMemo(
    () => computeFitnessAnalytics(trackers),
    [trackers],
  );

  useEffect(() => {
    fetchTrackers();
    fetchExercises();
  }, []);

  const fetchTrackers = async () => {
    try {
      const { data } = await API.get("/fitness");
      setTrackers(data);
    } catch (error) {
      console.error("Error fetching fitness trackers:", error);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data } = await API.get("/fitness/exercises");
      if (Array.isArray(data) && data.length > 0) {
        setExercises(data);
      }
    } catch (error) {
      console.warn("Using local exercise dataset fallback:", error);
    }
  };

  const recalculateCalories = (nextFormData, exerciseMeta = null) => {
    const resolvedExercise =
      exerciseMeta || EXERCISE_MAP[nextFormData.exerciseId] || selectedExercise;
    const bodyWeight = Number(nextFormData.weight) || 0;

    if (!resolvedExercise || bodyWeight <= 0) {
      setHelperDurationMinutes(0);
      return 0;
    }

    if (resolvedExercise.calculationMethod === "sets_reps") {
      const helperResult = calculateWorkoutCaloriesFromSetsReps(
        resolvedExercise.id,
        nextFormData.sets,
        nextFormData.reps,
        bodyWeight,
      );
      setHelperDurationMinutes(helperResult.estimatedDurationMinutes);
      return helperResult.calories;
    }

    setHelperDurationMinutes(0);
    return calculateWorkoutCalories(
      resolvedExercise.id,
      nextFormData.duration,
      bodyWeight,
    );
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);

    setFormData((previous) => {
      const next = {
        ...previous,
        exerciseId: exercise.id,
        exercise: exercise.name,
        type: exercise.workoutType || "cardio",
        category: exercise.category,
        workoutType: exercise.workoutType || "cardio",
        equipment: exercise.equipment,
        targetMuscles: exercise.targetMuscles,
        met: exercise.met,
        calculationMethod: exercise.calculationMethod,
        duration:
          exercise.calculationMethod === "sets_reps" ? 0 : previous.duration,
        sets: exercise.calculationMethod === "sets_reps" ? previous.sets : 0,
        reps: exercise.calculationMethod === "sets_reps" ? previous.reps : 0,
      };
      next.caloriesBurned = recalculateCalories(next, exercise);
      return next;
    });
  };

  const handleDurationChange = (value) => {
    const duration = Number(value) || 0;
    setFormData((previous) => {
      const next = { ...previous, duration };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleSetsChange = (value) => {
    const sets = Number(value) || 0;
    setFormData((previous) => {
      const next = { ...previous, sets, duration: 0 };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleRepsChange = (value) => {
    const reps = Number(value) || 0;
    setFormData((previous) => {
      const next = { ...previous, reps, duration: 0 };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const handleWeightChange = (value) => {
    const weight = Number(value) || 0;
    setFormData((previous) => {
      const next = { ...previous, weight };
      next.caloriesBurned = recalculateCalories(next);
      return next;
    });
  };

  const canSubmit = useMemo(() => {
    if (
      !formData.exerciseId ||
      !formData.exercise ||
      Number(formData.weight) <= 0
    ) {
      return false;
    }

    if (formData.calculationMethod === "sets_reps") {
      return Number(formData.sets) > 0 && Number(formData.reps) > 0;
    }

    return Number(formData.duration) > 0;
  }, [formData]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      const payload = {
        ...formData,
        type: formData.type || formData.workoutType || "cardio",
      };

      await API.post("/fitness", payload);

      setFormData(defaultFormData);
      setSelectedExercise(null);
      setSearchTerm("");
      setSelectedCategory("All");
      setHelperDurationMinutes(0);
      setIsModalOpen(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error creating fitness tracker:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/fitness/${id}`);
      fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white_0,_transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider">
              Professional Fitness Module
            </p>
            <h1 className="text-3xl font-bold mt-1">
              Workout and Calorie Intelligence
            </h1>
            <p className="text-sm text-cyan-50 mt-2">
              Track by duration or sets/reps, estimate calories automatically,
              and monitor progress trends.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Plus size={18} /> Log Workout
          </button>
        </div>
      </Card>

      <FitnessStats analytics={analytics} />

      <WorkoutChart
        monthlyTotals={analytics.monthlyTotals}
        muscleDistribution={analytics.muscleDistribution}
      />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="text-teal-500" size={18} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Workout History
          </h2>
        </div>

        <div className="space-y-3">
          {trackers.map((tracker) => (
            <WorkoutCard
              key={tracker._id}
              tracker={tracker}
              onDelete={handleDelete}
            />
          ))}
          {trackers.length === 0 && (
            <Card>
              <p className="text-gray-500 dark:text-gray-400">
                No workouts logged yet. Open the modal to add your first
                workout.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Log Workout"
        submitLabel="Save Workout"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        maxWidthClass="max-w-3xl"
      >
        <WorkoutForm
          exercises={exercises}
          categories={EXERCISE_CATEGORIES}
          selectedExercise={selectedExercise}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          formData={formData}
          helperDurationMinutes={helperDurationMinutes}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onSelectExercise={handleSelectExercise}
          onDurationChange={handleDurationChange}
          onSetsChange={handleSetsChange}
          onRepsChange={handleRepsChange}
          onWeightChange={handleWeightChange}
        />
        {!canSubmit && (
          <p className="text-xs text-red-500 mt-3">
            Select an exercise, enter body weight, and provide duration or
            sets/reps.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Fitness;
