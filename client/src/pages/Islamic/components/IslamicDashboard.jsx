import React from "react";
import { Target, Trophy, TrendingUp } from "lucide-react";
import Card from "../../../components/Card";

const IslamicDashboard = ({ backlog, currentStreak }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remaining Salah
          </p>
          <Target size={18} className="text-rose-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {backlog.remainingDays || 0}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
      </Card>

      <Card className="border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          <Trophy size={18} className="text-emerald-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {backlog.completedDays || 0}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">makeup days</p>
      </Card>

      <Card className="border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
          <TrendingUp size={18} className="text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {backlog.progressPercentage || 0}%
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          from total backlog days
        </p>
      </Card>

      <Card className="border border-gray-100 dark:border-gray-700 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Streak
          </p>
          <Trophy size={18} className="text-amber-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {currentStreak || 0}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          days with all 5 salah
        </p>
      </Card>
    </div>
  );
};

export default IslamicDashboard;
