import React from "react";
import Card from "../../../components/Card";
import { Dumbbell, Flame, Timer, Trash2 } from "lucide-react";

const WorkoutCard = ({ tracker, onDelete }) => {
  return (
    <Card className="border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-teal-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              {tracker.exercise}
            </h3>
          </div>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            {tracker.category || tracker.type} ·{" "}
            {new Date(tracker.date).toLocaleDateString()}
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <p className="flex items-center gap-1 text-gray-700 dark:text-gray-200">
              <Timer size={14} /> {tracker.duration || 0} min
            </p>
            <p className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Flame size={14} /> {tracker.caloriesBurned || 0} kcal
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              Weight: {tracker.weight || 0} kg
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              Volume: {tracker.sets || 0} x {tracker.reps || 0}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(tracker._id)}
          className="h-9 w-9 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/30"
          aria-label="Delete workout"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  );
};

export default WorkoutCard;
