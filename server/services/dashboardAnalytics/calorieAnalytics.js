module.exports = function analyzeCalories({
  rangeData,
  previousData,
  context,
  window,
}) {
  const { round, listDays, toDateKey } = context;

  const consumedCalories = rangeData.reduce(
    (sum, entry) => sum + Number(entry.calories || 0),
    0,
  );

  const previousConsumedCalories = previousData.reduce(
    (sum, entry) => sum + Number(entry.calories || 0),
    0,
  );

  const burnedCalories = context.fitnessRangeData.reduce(
    (sum, entry) => sum + Number(entry.caloriesBurned || 0),
    0,
  );

  const netCalories = consumedCalories - burnedCalories;
  const maintenanceCalories = Number.isFinite(
    Number(context.maintenanceCalories),
  )
    ? Number(context.maintenanceCalories)
    : 2200 * Math.max(1, window.days);

  const statusMeta =
    netCalories > maintenanceCalories
      ? {
          status: "surplus",
          color: "red",
          message: "You are currently in calorie surplus",
        }
      : {
          status: "deficit",
          color: "green",
          message: "You are maintaining a calorie deficit",
        };

  const daily = listDays(window.start, window.days).map((date) => ({
    date,
    consumed: 0,
    burned: 0,
    balance: 0,
  }));
  const index = new Map(daily.map((entry, idx) => [entry.date, idx]));

  rangeData.forEach((entry) => {
    const idx = index.get(toDateKey(entry.date));
    if (idx == null) return;
    daily[idx].consumed += Number(entry.calories || 0);
    daily[idx].balance = daily[idx].consumed - daily[idx].burned;
  });

  context.fitnessRangeData.forEach((entry) => {
    const idx = index.get(toDateKey(entry.date));
    if (idx == null) return;
    daily[idx].burned += Number(entry.caloriesBurned || 0);
    daily[idx].balance = daily[idx].consumed - daily[idx].burned;
  });

  const weeklyAverageBalance = round(
    daily.slice(-7).reduce((sum, entry) => sum + entry.balance, 0) /
      Math.max(1, Math.min(window.days, 7)),
    0,
  );

  const weights = context.fitnessRangeData
    .filter((entry) => Number(entry.weight || 0) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry) => ({
      date: toDateKey(entry.date),
      weight: Number(entry.weight),
    }));

  const weightTrendPrediction = (() => {
    if (weights.length < 2) return null;
    const recent = weights.slice(-7);
    const delta = recent[recent.length - 1].weight - recent[0].weight;
    const perDay = delta / Math.max(1, recent.length - 1);
    return {
      trend: perDay < 0 ? "decreasing" : perDay > 0 ? "increasing" : "stable",
      predicted7DayChange: round(perDay * 7, 2),
    };
  })();

  const insights = [
    {
      area: "calories",
      priority: statusMeta.status === "surplus" ? "high" : "medium",
      text: `${statusMeta.message}. Weekly average balance is ${weeklyAverageBalance} kcal.`,
    },
  ];

  return {
    summary: {
      consumedCalories: round(consumedCalories, 0),
      burnedCalories: round(burnedCalories, 0),
      netCalories: round(netCalories, 0),
      maintenanceCalories: round(maintenanceCalories, 0),
      weeklyAverageBalance,
      weightTrendPrediction,
      ...statusMeta,
    },
    charts: {
      consumedVsBurned: daily.map((entry) => ({
        date: entry.date,
        consumed: round(entry.consumed, 0),
        burned: round(entry.burned, 0),
        balance: round(entry.balance, 0),
      })),
      weeklyBalance: daily.slice(-7).map((entry) => ({
        date: entry.date,
        balance: round(entry.balance, 0),
      })),
      weightProgress: weights,
    },
    insights,
    score: {
      value: context.clamp(
        Math.round(100 - Math.min(Math.abs(weeklyAverageBalance) / 25, 100)),
        0,
        100,
      ),
      changedByPercent: context.calcChange(
        consumedCalories,
        previousConsumedCalories,
      ),
    },
  };
};
