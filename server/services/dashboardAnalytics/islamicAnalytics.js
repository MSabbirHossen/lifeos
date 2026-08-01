const SALAH_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

module.exports = function analyzeIslamic({
  rangeData,
  previousData,
  context,
  window,
}) {
  const { round, toDateKey, listDays, getStreakFromDateKeys, clamp } = context;

  const prayerPerformed = rangeData.reduce(
    (sum, item) =>
      sum +
      SALAH_NAMES.filter(
        (name) =>
          item?.salah?.[name]?.status === "PERFORMED" ||
          item?.salah?.[name] === true,
      ).length,
    0,
  );
  const prayerTotal = rangeData.length * 5;
  const prayerScore = prayerTotal
    ? round((prayerPerformed / prayerTotal) * 100)
    : 0;

  const quranPages = rangeData.reduce(
    (sum, item) => sum + Number(item.quranPages || 0),
    0,
  );

  const quranKeys = Array.from(
    new Set(
      rangeData
        .filter((item) => Number(item.quranPages || 0) > 0)
        .map((item) => toDateKey(item.date)),
    ),
  );
  const quranStreak = getStreakFromDateKeys(quranKeys);

  const islamicLessons = rangeData.reduce((sum, item) => {
    const hadith = String(item.hadithNotes || "").trim();
    const quality = String(item.qualityNotes || "").trim();
    return sum + (hadith || quality ? 1 : 0);
  }, 0);

  const consistencyScore = round(
    prayerScore * 0.7 +
      clamp((quranPages / Math.max(1, window.days * 2)) * 100, 0, 100) * 0.2 +
      clamp((islamicLessons / Math.max(1, window.days / 2)) * 100, 0, 100) *
        0.1,
  );

  const prevPrayerPerformed = previousData.reduce(
    (sum, item) =>
      sum +
      SALAH_NAMES.filter(
        (name) =>
          item?.salah?.[name]?.status === "PERFORMED" ||
          item?.salah?.[name] === true,
      ).length,
    0,
  );
  const prevPrayerScore = previousData.length
    ? round((prevPrayerPerformed / (previousData.length * 5)) * 100)
    : 0;

  const days = listDays(window.start, window.days);
  const prayerConsistency = days.map((date) => ({
    date,
    percentage: 0,
    prayers: 0,
  }));
  const quranSeries = days.map((date) => ({ date, pages: 0 }));
  const prayerIndex = new Map(
    prayerConsistency.map((item, idx) => [item.date, idx]),
  );

  rangeData.forEach((entry) => {
    const idx = prayerIndex.get(toDateKey(entry.date));
    if (idx == null) return;
    const performed = SALAH_NAMES.filter(
      (name) =>
        entry?.salah?.[name]?.status === "PERFORMED" ||
        entry?.salah?.[name] === true,
    ).length;
    prayerConsistency[idx].prayers = performed;
    prayerConsistency[idx].percentage = round((performed / 5) * 100, 0);
    quranSeries[idx].pages += Number(entry.quranPages || 0);
  });

  const insights = [
    {
      area: "islamic",
      priority: consistencyScore >= 80 ? "medium" : "high",
      text: `Prayer score is ${prayerScore}% and Quran streak is ${quranStreak} days.`,
    },
  ];

  return {
    summary: {
      prayerScore,
      quranPages,
      quranStreak,
      islamicLessons,
      consistencyScore,
      previousPrayerScore: prevPrayerScore,
      summary: `Prayer score ${prayerScore}%, Quran streak ${quranStreak} days, ${quranPages} pages read.`,
    },
    charts: {
      prayerConsistency,
      quranPages: quranSeries,
      timeline: prayerConsistency.map((item, idx) => ({
        date: item.date,
        prayers: item.prayers,
        quranPages: quranSeries[idx].pages,
      })),
    },
    insights,
    score: {
      value: consistencyScore,
      changedByPercent: context.calcChange(prayerScore, prevPrayerScore),
    },
  };
};
