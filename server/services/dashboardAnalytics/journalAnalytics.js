module.exports = function analyzeJournal({
  rangeData,
  previousData,
  context,
  window,
}) {
  const {
    round,
    toDateKey,
    listDays,
    getMoodScore,
    getStreakFromDateKeys,
    calcTrendDirection,
  } = context;

  const entries = rangeData.length;
  const previousEntries = previousData.length;

  const dayKeys = Array.from(
    new Set(rangeData.map((entry) => toDateKey(entry.date))),
  );
  const writingStreak = getStreakFromDateKeys(dayKeys);
  const entryFrequency = round(
    (dayKeys.length / Math.max(1, window.days)) * 100,
  );

  const totalWords = rangeData.reduce(
    (sum, entry) =>
      sum +
      String(entry.notes || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
    0,
  );
  const averageWords = round(totalWords / Math.max(1, entries));

  const moodByDay = listDays(window.start, window.days).map((date) => ({
    date,
    moodScore: 0,
  }));
  const moodIndex = new Map(
    moodByDay.map((entry, index) => [entry.date, index]),
  );
  rangeData.forEach((entry) => {
    const idx = moodIndex.get(toDateKey(entry.date));
    if (idx == null) return;
    moodByDay[idx].moodScore = getMoodScore(entry.mood);
  });

  const nonZeroMood = moodByDay.map((entry) => entry.moodScore).filter(Boolean);
  const moodAverage = nonZeroMood.length
    ? round(nonZeroMood.reduce((sum, v) => sum + v, 0) / nonZeroMood.length)
    : 0;
  const moodTrend = calcTrendDirection(nonZeroMood);

  const insights = [
    {
      area: "journal",
      priority: entries > 0 ? "medium" : "high",
      text:
        entries > 0
          ? `You wrote ${entries} journal entries with ${averageWords} average words.`
          : "Add journal entries to unlock emotional trend analytics.",
    },
  ];

  return {
    summary: {
      entries,
      entryFrequency,
      writingStreak,
      averageWords,
      moodTrend,
      moodAverage,
      previousEntries,
      recentEntries: rangeData.slice(0, 20),
      summary:
        entries > 0
          ? `You wrote ${entries} entries and maintained a ${writingStreak}-day streak.`
          : "Start journaling to unlock emotional trend analytics.",
    },
    charts: {
      moodTrend: moodByDay,
    },
    insights,
    score: {
      value: context.clamp(
        Math.round((entryFrequency + moodAverage) / 2),
        0,
        100,
      ),
      changedByPercent: context.calcChange(entries, previousEntries),
    },
  };
};
