import React from "react";

const CaloriesCalculator = ({
  selectedExercise,
  bodyWeight,
  duration,
  calories,
}) => {
  if (!selectedExercise) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-gray-500 dark:text-gray-400 dark:border-gray-700">
        Select an exercise to preview MET and calories.
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        Auto Calories Estimate
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Calories = MET × 3.5 × Body Weight (kg) ÷ 200 × Duration (min)
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        MET {selectedExercise.met} · Weight {Number(bodyWeight) || 0} kg ·
        Duration {Number(duration) || 0} min
      </p>
      <p className="mt-2 text-lg font-bold text-orange-500">
        {Number(calories) || 0} kcal
      </p>
    </div>
  );
};

export default CaloriesCalculator;
