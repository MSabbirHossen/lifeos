const PRODUCTIVE_CATEGORIES = new Set([
  "study",
  "work",
  "exercise",
  "learning",
  "project",
  "deep work",
]);

module.exports = function analyzeTime({
  rangeData,
  previousData,
  context,
  window,
  monthData,
}) {
  const {
    round,
    getOverlapSeconds,
    toDayStart,
    toDayEnd,
    toDateKey,
    listDays,
  } = context;

  const timeSecondsInRange = rangeData.reduce(
    (sum, entry) =>
      sum +
      getOverlapSeconds(
        entry.startTime,
        entry.endTime,
        window.start,
        window.end,
      ),
    0,
  );

  const productiveSeconds = rangeData.reduce((sum, entry) => {
    const category = String(entry.category || "").toLowerCase();
    const productive =
      PRODUCTIVE_CATEGORIES.has(category) ||
      category.includes("study") ||
      category.includes("work") ||
      category.includes("exercise");
    if (!productive) return sum;
    return (
      sum +
      getOverlapSeconds(
        entry.startTime,
        entry.endTime,
        window.start,
        window.end,
      )
    );
  }, 0);

  const todayStart = toDayStart(new Date());
  const weekStart = toDayStart(new Date());
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = toDayStart(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const todayHours = round(
    rangeData.reduce(
      (sum, entry) =>
        sum +
        getOverlapSeconds(
          entry.startTime,
          entry.endTime,
          todayStart,
          toDayEnd(todayStart),
        ),
      0,
    ) / 3600,
  );

  const weeklyHours = round(
    rangeData.reduce(
      (sum, entry) =>
        sum +
        getOverlapSeconds(
          entry.startTime,
          entry.endTime,
          weekStart,
          toDayEnd(new Date()),
        ),
      0,
    ) / 3600,
  );

  const monthlyHours = round(
    monthData.reduce(
      (sum, entry) =>
        sum +
        getOverlapSeconds(
          entry.startTime,
          entry.endTime,
          monthStart,
          toDayEnd(new Date()),
        ),
      0,
    ) / 3600,
  );

  const totalHours = round(timeSecondsInRange / 3600);
  const productivityPercentage =
    timeSecondsInRange > 0
      ? round((productiveSeconds / timeSecondsInRange) * 100)
      : 0;

  const mostProductiveActivity =
    Object.entries(
      rangeData.reduce((acc, entry) => {
        const name = entry?.task?.name || "Untitled Task";
        acc[name] = (acc[name] || 0) + Number(entry.durationSeconds || 0);
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([name, seconds]) => ({ name, hours: round(seconds / 3600) }))[0] ||
    null;

  const prevHours =
    previousData.reduce(
      (sum, entry) =>
        sum +
        getOverlapSeconds(
          entry.startTime,
          entry.endTime,
          window.prevStart,
          window.prevEnd,
        ),
      0,
    ) / 3600;

  const trendByDay = listDays(window.start, window.days).map((date) => ({
    date,
    hours: 0,
  }));
  const trendIndex = new Map(
    trendByDay.map((item, index) => [item.date, index]),
  );
  rangeData.forEach((entry) => {
    const idx = trendIndex.get(toDateKey(entry.startTime));
    if (idx == null) return;
    trendByDay[idx].hours += Number(entry.durationSeconds || 0) / 3600;
  });

  const distribution = [
    {
      name: "Study",
      value: round(
        rangeData
          .filter((e) =>
            String(e.category || "")
              .toLowerCase()
              .includes("study"),
          )
          .reduce((sum, e) => sum + Number(e.durationSeconds || 0), 0) / 3600,
      ),
    },
    {
      name: "Work",
      value: round(
        rangeData
          .filter((e) =>
            String(e.category || "")
              .toLowerCase()
              .includes("work"),
          )
          .reduce((sum, e) => sum + Number(e.durationSeconds || 0), 0) / 3600,
      ),
    },
    {
      name: "Exercise",
      value: round(
        rangeData
          .filter((e) =>
            String(e.category || "")
              .toLowerCase()
              .includes("exercise"),
          )
          .reduce((sum, e) => sum + Number(e.durationSeconds || 0), 0) / 3600,
      ),
    },
    {
      name: "Other",
      value: round(
        rangeData
          .filter((e) => {
            const c = String(e.category || "").toLowerCase();
            return (
              !c.includes("study") &&
              !c.includes("work") &&
              !c.includes("exercise")
            );
          })
          .reduce((sum, e) => sum + Number(e.durationSeconds || 0), 0) / 3600,
      ),
    },
  ];

  const score = {
    value: productivityPercentage,
    changedByPercent: context.calcChange(totalHours, prevHours),
  };

  const insights = [];
  if (totalHours === 0) {
    insights.push({
      area: "productivity",
      priority: "high",
      text: "No time logs detected in this range. Start with one focused session.",
    });
  } else {
    insights.push({
      area: "productivity",
      priority: "medium",
      text: `You logged ${totalHours} hours and maintained ${productivityPercentage}% productivity focus.`,
    });
  }

  return {
    summary: {
      todayHours,
      weeklyHours,
      monthlyHours,
      totalHours,
      productivityPercentage,
      mostProductiveActivity,
      previousHours: round(prevHours),
      summary: `You logged ${totalHours} hours with ${productivityPercentage}% productive focus.`,
    },
    charts: {
      productivity30d: trendByDay.map((d) => ({
        date: d.date,
        hours: round(d.hours),
      })),
      distribution,
    },
    insights,
    score,
  };
};
