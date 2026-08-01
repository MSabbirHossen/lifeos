import React, { useMemo } from "react";
import { Search } from "lucide-react";

const ExerciseSelector = ({
  exercises,
  categories,
  searchTerm,
  selectedCategory,
  selectedExerciseId,
  onSearchChange,
  onCategoryChange,
  onSelectExercise,
}) => {
  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const categoryMatches =
        selectedCategory === "All" || exercise.category === selectedCategory;
      const searchMatches =
        normalizedSearch.length === 0 ||
        exercise.name.toLowerCase().includes(normalizedSearch) ||
        exercise.equipment.toLowerCase().includes(normalizedSearch) ||
        exercise.targetMuscles.some((muscle) =>
          muscle.toLowerCase().includes(normalizedSearch),
        );

      return categoryMatches && searchMatches;
    });
  }, [exercises, searchTerm, selectedCategory]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by exercise, equipment, or muscle"
            className="w-full p-2 pl-9 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="All">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-64 overflow-y-auto border rounded-lg divide-y dark:divide-gray-700 dark:border-gray-700">
        {filteredExercises.map((exercise) => {
          const isActive = selectedExerciseId === exercise.id;

          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onSelectExercise(exercise)}
              className={`w-full text-left p-3 transition-colors ${
                isActive
                  ? "bg-teal-50 dark:bg-teal-900/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
              }`}
            >
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {exercise.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {exercise.category} · {exercise.equipment}
                  </p>
                </div>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-300">
                  MET {exercise.met}
                </span>
              </div>
            </button>
          );
        })}
        {filteredExercises.length === 0 && (
          <p className="p-3 text-sm text-gray-500 dark:text-gray-400">
            No exercises found with this search/filter.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExerciseSelector;
