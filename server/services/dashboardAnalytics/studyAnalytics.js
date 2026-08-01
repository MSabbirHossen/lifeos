module.exports = function analyzeStudy({
  rangeData,
  previousData,
  context,
  window,
}) {
  const { round, toDateKey, listDays, getStreakFromDateKeys } = context;

  const totalMinutes = rangeData.reduce(
    (sum, entry) => sum + Number(entry.duration || 0),
    0,
  );
  const totalHours = round(totalMinutes / 60);

  const previousHours = round(
    previousData.reduce((sum, entry) => sum + Number(entry.duration || 0), 0) /
      60,
  );

  const subjectDistribution = Object.entries(
    rangeData.reduce((acc, entry) => {
      const key = entry.subject || "Other";
      acc[key] = (acc[key] || 0) + Number(entry.duration || 0);
      return acc;
    }, {}),
  )
    .map(([name, minutes]) => ({ name, hours: round(minutes / 60) }))
    .sort((a, b) => b.hours - a.hours);

  const studyDayKeys = Array.from(
    new Set(rangeData.map((entry) => toDateKey(entry.date))),
  );
  const weeklyConsistency = round(
    (studyDayKeys.filter((key) => {
      const d = new Date(key);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      return d >= weekStart;
    }).length /
      7) *
      100,
  );

  const currentStreak = getStreakFromDateKeys(studyDayKeys);

  const days = listDays(window.start, window.days);
  const daily = days.map((date) => ({ date, hours: 0 }));
  const index = new Map(daily.map((item, idx) => [item.date, idx]));
  rangeData.forEach((entry) => {
    const idx = index.get(toDateKey(entry.date));
    if (idx == null) return;
    daily[idx].hours += Number(entry.duration || 0) / 60;
  });

  const topSubject = subjectDistribution[0] || null;

  const insights = [];
  if (totalHours > previousHours) {
    insights.push({
      area: "study",
      priority: "high",
      text: `Study time increased by ${Math.abs(context.calcChange(totalHours, previousHours))}% versus previous period.`,
    });
  } else {
    insights.push({
      area: "study",
      priority: "medium",
      text: `Study time is ${totalHours}h. Aim for a ${Math.max(12, totalHours + 2)}h target next period.`,
    });
  }

  const normalizedGoalScore = context.clamp(
    Math.round((totalHours / Math.max(1, (window.days / 7) * 12)) * 100),
    0,
    100,
  );

  return {
    summary: {
      totalDurationMinutes: totalMinutes,
      totalHours,
      subjectDistribution,
      weeklyConsistency,
      currentStreak,
      previousHours,
      summary: topSubject
        ? `You studied ${totalHours} hours. ${topSubject.name} led with ${topSubject.hours} hours.`
        : "No study sessions in this period.",
    },
    charts: {
      weeklyBars: daily
        .slice(-7)
        .map((item) => ({ date: item.date, hours: round(item.hours) })),
      monthlyLine: daily.map((item) => ({
        date: item.date,
        hours: round(item.hours),
      })),
      subjectDistribution: subjectDistribution.map((item) => ({
        name: item.name,
        value: item.hours,
      })),
    },
    insights,
    score: {
      value: normalizedGoalScore,
      changedByPercent: context.calcChange(totalHours, previousHours),
    },
  };
};
