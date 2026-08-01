import React from "react";
import ExerciseSelector from "./ExerciseSelector";
import CaloriesCalculator from "./CaloriesCalculator";

const WorkoutForm = ({
  exercises,
  categories,
  selectedExercise,
  searchTerm,
  selectedCategory,
  formData,
  helperDurationMinutes,
  onSearchChange,
  onCategoryChange,
  onSelectExercise,
  onDurationChange,
  onSetsChange,
  onRepsChange,
  onWeightChange,
}) => {
  const usesSetRepMode = selectedExercise?.calculationMethod === "sets_reps";
  const resolvedDuration =
    Number(formData.duration) || helperDurationMinutes || 0;

  return (
    <div className="space-y-4">
      <ExerciseSelector
        exercises={exercises}
        categories={categories}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedExerciseId={formData.exerciseId}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
        onSelectExercise={onSelectExercise}
      />

      {selectedExercise && (
        <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">
            {selectedExercise.name}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
            <p>Category: {selectedExercise.category}</p>
            <p>Type: {selectedExercise.workoutType}</p>
            <p>Equipment: {selectedExercise.equipment}</p>
            <p>MET: {selectedExercise.met}</p>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Target muscles: {selectedExercise.targetMuscles.join(", ")}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Body Weight (kg)
        </label>
        <input
          type="number"
          min="1"
          value={formData.weight}
          onChange={(event) => onWeightChange(event.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          placeholder="e.g. 72"
        />
      </div>

      {!usesSetRepMode && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={formData.duration}
            onChange={(event) => onDurationChange(event.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Enter workout duration"
          />
        </div>
      )}

      {usesSetRepMode && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Sets
            </label>
            <input
              type="number"
              min="0"
              value={formData.sets}
              onChange={(event) => onSetsChange(event.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g. 4"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reps
            </label>
            <input
              type="number"
              min="0"
              value={formData.reps}
              onChange={(event) => onRepsChange(event.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g. 12"
            />
          </div>
          <p className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
            Duration is estimated from sets/reps for calorie calculation.
            {helperDurationMinutes > 0
              ? ` Estimated duration: ${helperDurationMinutes} min.`
              : ""}
          </p>
        </div>
      )}

      <CaloriesCalculator
        selectedExercise={selectedExercise}
        bodyWeight={formData.weight}
        duration={resolvedDuration}
        calories={formData.caloriesBurned}
      />
    </div>
  );
};

export default WorkoutForm;
