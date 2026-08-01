module.exports = function analyzeFitness({
  rangeData,
  previousData,
  context,
  window,
}) {
  const { round, listDays, toDateKey } = context;

  const totalWorkouts = rangeData.length;
  const previousWorkouts = previousData.length;

  const totalMinutes = round(
    rangeData.reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
    0,
  );

  const caloriesBurned = round(
    rangeData.reduce(
      (sum, entry) => sum + Number(entry.caloriesBurned || 0),
      0,
    ),
    0,
  );

  const workoutDays = new Set(rangeData.map((entry) => toDateKey(entry.date)));
  const workoutConsistency = round(
    (workoutDays.size / Math.max(1, window.days)) * 100,
  );

  const muscleGroupFrequency = Object.entries(
    rangeData.reduce((acc, entry) => {
      (entry.targetMuscles || []).forEach((muscle) => {
        if (!muscle) return;
        acc[muscle] = (acc[muscle] || 0) + 1;
      });
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const categoryDistribution = Object.entries(
    rangeData.reduce((acc, entry) => {
      const key = entry.type || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const workoutFrequency = listDays(window.start, window.days).map((date) => ({
    date,
    workouts: 0,
    calories: 0,
  }));
  const index = new Map(
    workoutFrequency.map((entry, idx) => [entry.date, idx]),
  );
  rangeData.forEach((entry) => {
    const idx = index.get(toDateKey(entry.date));
    if (idx == null) return;
    workoutFrequency[idx].workouts += 1;
    workoutFrequency[idx].calories += Number(entry.caloriesBurned || 0);
  });

  const insights = [
    {
      area: "fitness",
      priority: workoutConsistency >= 50 ? "medium" : "high",
      text: `You completed ${totalWorkouts} workouts with ${caloriesBurned} calories burned.`,
    },
  ];

  return {
    summary: {
      totalWorkouts,
      previousWorkouts,
      totalMinutes,
      caloriesBurned,
      muscleGroupFrequency,
      workoutConsistency,
      summary: `You completed ${totalWorkouts} workouts and trained ${muscleGroupFrequency.length} muscle groups.`,
    },
    charts: {
      workoutFrequency: workoutFrequency.map((entry) => ({
        date: entry.date,
        workouts: entry.workouts,
      })),
      caloriesTrend: workoutFrequency.map((entry) => ({
        date: entry.date,
        calories: round(entry.calories, 0),
      })),
      categoryDistribution,
    },
    insights,
    score: {
      value: context.clamp(Math.round(workoutConsistency), 0, 100),
      changedByPercent: context.calcChange(totalWorkouts, previousWorkouts),
    },
  };
};
