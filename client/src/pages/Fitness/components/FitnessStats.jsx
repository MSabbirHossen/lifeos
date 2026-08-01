import React from "react";
import Card from "../../../components/Card";
import {
  Activity,
  CalendarDays,
  Flame,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";

const statCards = [
  {
    key: "todayCalories",
    label: "Today Calories",
    icon: Flame,
    color: "text-orange-500",
  },
  {
    key: "weeklyCalories",
    label: "Weekly Calories",
    icon: Zap,
    color: "text-red-500",
  },
  {
    key: "totalDuration",
    label: "Total Duration",
    icon: Timer,
    color: "text-blue-500",
    suffix: " min",
  },
  {
    key: "streak",
    label: "Workout Streak",
    icon: CalendarDays,
    color: "text-emerald-500",
    suffix: " days",
  },
  {
    key: "totalWorkouts",
    label: "Total Workouts",
    icon: Activity,
    color: "text-purple-500",
  },
];

const FitnessStats = ({ analytics }) => {
  const topFavorite = analytics.favoriteExercises[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.key}
              className="border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-bold mt-2 ${card.color}`}>
                    {analytics[card.key] || 0}
                    {card.suffix || ""}
                  </p>
                </div>
                <Icon size={18} className={card.color} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" />
            <p className="font-semibold text-gray-900 dark:text-white">
              Favorite Exercises
            </p>
          </div>
          <div className="space-y-2">
            {analytics.favoriteExercises.slice(0, 4).map((item) => {
              const width = topFavorite
                ? (item.count / topFavorite.count) * 100
                : 0;

              return (
                <div key={item.name}>
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <span>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded bg-gradient-to-r from-teal-500 to-cyan-500"
                      style={{ width: `${Math.max(width, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {analytics.favoriteExercises.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No workouts logged yet.
              </p>
            )}
          </div>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-3">
            Muscle Group Distribution
          </p>
          <div className="space-y-2">
            {analytics.muscleDistribution.slice(0, 5).map((item) => {
              const maxValue = analytics.muscleDistribution[0]?.value || 1;
              const width = (item.value / maxValue) * 100;

              return (
                <div key={item.name}>
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded bg-gradient-to-r from-orange-400 to-rose-500"
                      style={{ width: `${Math.max(width, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {analytics.muscleDistribution.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Distribution appears after your first log.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FitnessStats;
