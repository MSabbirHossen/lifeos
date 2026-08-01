import React, { useMemo } from "react";
import Card from "../../../components/Card";
import { getStatusStyles } from "../islamicUtils";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const IslamicCalendar = ({ calendar }) => {
  const mapped = useMemo(() => {
    const map = new Map();
    (calendar || []).forEach((entry) => {
      map.set(entry.date, entry.status);
    });
    return map;
  }, [calendar]);

  const month = new Date();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, monthIndex, day);
    const key = date.toISOString().slice(0, 10);
    cells.push({ day, status: mapped.get(key) || "MISSED" });
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Daily History Calendar
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 dark:text-gray-400">
        {weekDays.map((day) => (
          <div key={day} className="font-semibold">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          return (
            <div
              key={cell.day}
              className={`h-9 rounded flex items-center justify-center text-xs font-semibold ${getStatusStyles(cell.status)}`}
              title={cell.status}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Green: All salah completed
        </span>
        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Yellow: Partial
        </span>
        <span className="px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Red: Missed salah
        </span>
      </div>
    </Card>
  );
};

export default IslamicCalendar;
