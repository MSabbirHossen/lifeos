module.exports = function analyzeHabits({ rangeData, context, window }) {
  const { round, toDateKey, listDays, getStreakFromDateKeys } = context;

  const activeHabits = context.activeHabits || [];
  const activeIds = new Set(activeHabits.map((item) => String(item._id)));

  const completedLogs = rangeData.filter(
    (log) => log.completed && activeIds.has(String(log.habitId)),
  );

  const totalPossible = activeHabits.length * Math.max(1, window.days);
  const completionRate = totalPossible
    ? round((completedLogs.length / totalPossible) * 100, 0)
    : 0;

  const habitProgress = activeHabits.map((habit) => {
    const id = String(habit._id);
    const dates = completedLogs
      .filter((log) => String(log.habitId) === id)
      .map((log) => toDateKey(log.date));

    const streak = getStreakFromDateKeys(dates);
    const rate = round((dates.length / Math.max(1, window.days)) * 100, 0);
    return { name: habit.name, completionRate: rate, streak };
  });

  const bestHabit =
    habitProgress
      .slice()
      .sort((a, b) => b.completionRate - a.completionRate)[0] || null;
  const worstHabit =
    habitProgress
      .slice()
      .sort((a, b) => a.completionRate - b.completionRate)[0] || null;
  const longestStreak = habitProgress.reduce(
    (max, habit) => Math.max(max, habit.streak),
    0,
  );

  const heatmapDays = listDays(context.heatmapStart, context.heatmapDays).map(
    (date) => ({
      date,
      completion: 0,
    }),
  );
  const heatmapIndex = new Map(
    heatmapDays.map((item, idx) => [item.date, idx]),
  );
  const byDate = new Map();
  completedLogs.forEach((log) => {
    const key = toDateKey(log.date);
    byDate.set(key, (byDate.get(key) || 0) + 1);
  });

  heatmapDays.forEach((entry) => {
    const done = byDate.get(entry.date) || 0;
    entry.completion = activeHabits.length
      ? round((done / activeHabits.length) * 100, 0)
      : 0;
  });

  const insights = [
    {
      area: "habits",
      priority: completionRate >= 70 ? "medium" : "high",
      text: bestHabit
        ? `${bestHabit.name} is your strongest habit at ${bestHabit.completionRate}%.`
        : "Create habits to unlock consistency tracking.",
    },
  ];

  return {
    summary: {
      completionRate,
      completed: completionRate,
      incomplete: Math.max(0, 100 - completionRate),
      bestHabit,
      worstHabit,
      longestStreak,
      summary: bestHabit
        ? `${bestHabit.name} leads with ${bestHabit.completionRate}% completion.`
        : "No active habits tracked yet.",
    },
    charts: {
      heatmap: heatmapDays,
      streaks: habitProgress.map((habit) => ({
        name: habit.name,
        completion: habit.streak,
      })),
      individualProgress: habitProgress.map((habit) => ({
        name: habit.name,
        completion: habit.completionRate,
      })),
    },
    insights,
    score: {
      value: completionRate,
      changedByPercent: 0,
    },
  };
};
