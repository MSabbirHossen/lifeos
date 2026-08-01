import { EXERCISE_MAP } from "../../data/exercises";

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (inputDate) => {
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const isSameDay = (left, right) => toDateKey(left) === toDateKey(right);

const getEffectiveDuration = (tracker) => Number(tracker.duration) || 0;

const getResolvedExercise = (tracker) =>
  EXERCISE_MAP[tracker.exerciseId] || null;

export const computeFitnessAnalytics = (trackers) => {
  const safeTrackers = Array.isArray(trackers) ? trackers : [];
  const today = startOfToday();

  const todayCalories = safeTrackers
    .filter((item) => isSameDay(item.date, today))
    .reduce((sum, item) => sum + (Number(item.caloriesBurned) || 0), 0);

  const weekStart = new Date(today.getTime() - 6 * DAY_MS);
  const weeklyCalories = safeTrackers
    .filter((item) => new Date(item.date) >= weekStart)
    .reduce((sum, item) => sum + (Number(item.caloriesBurned) || 0), 0);

  const totalDuration = safeTrackers.reduce(
    (sum, item) => sum + getEffectiveDuration(item),
    0,
  );

  const dateCounts = safeTrackers.reduce((accumulator, item) => {
    const key = toDateKey(item.date);
    if (!key) {
      return accumulator;
    }
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const checkDate = new Date(today.getTime() - offset * DAY_MS);
    const key = toDateKey(checkDate);
    if (dateCounts[key]) {
      streak += 1;
      continue;
    }
    if (offset === 0) {
      continue;
    }
    break;
  }

  const favoriteExerciseMap = safeTrackers.reduce((accumulator, item) => {
    const key = item.exercise || "Unknown Exercise";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const favoriteExercises = Object.entries(favoriteExerciseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const muscleDistributionMap = safeTrackers.reduce((accumulator, item) => {
    const exercise = getResolvedExercise(item);
    const muscles =
      item.targetMuscles?.length > 0
        ? item.targetMuscles
        : exercise?.targetMuscles || ["Uncategorized"];

    muscles.forEach((muscle) => {
      accumulator[muscle] = (accumulator[muscle] || 0) + 1;
    });

    return accumulator;
  }, {});

  const muscleDistribution = Object.entries(muscleDistributionMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const monthlyTotals = [];
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1);

  for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
    const monthDate = new Date(
      cursor.getFullYear(),
      cursor.getMonth() - monthOffset,
      1,
    );
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    const monthTrackers = safeTrackers.filter((item) => {
      const date = new Date(item.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    monthlyTotals.push({
      label: monthDate.toLocaleDateString(undefined, { month: "short" }),
      calories: monthTrackers.reduce(
        (sum, item) => sum + (Number(item.caloriesBurned) || 0),
        0,
      ),
      duration: monthTrackers.reduce(
        (sum, item) => sum + getEffectiveDuration(item),
        0,
      ),
      workouts: monthTrackers.length,
    });
  }

  return {
    totalWorkouts: safeTrackers.length,
    todayCalories,
    weeklyCalories,
    totalDuration,
    streak,
    favoriteExercises,
    muscleDistribution,
    monthlyTotals,
  };
};
