const User = require("../../models/User");
const TimeTracker = require("../../models/TimeTracker");
const Study = require("../../models/Study");
const IslamicTracker = require("../../models/IslamicTracker");
const Journal = require("../../models/Journal");
const CalorieTracker = require("../../models/CalorieTracker");
const FitnessTracker = require("../../models/FitnessTracker");
const UserHabit = require("../../models/UserHabit");
const HabitLog = require("../../models/HabitLog");
const FinanceTracker = require("../../models/FinanceTracker");
const { getRatesForDate } = require("../currencyService");
const { computeLifeScore } = require("../lifeScoreService");
const analyzeTime = require("./timeAnalytics");
const analyzeStudy = require("./studyAnalytics");
const analyzeIslamic = require("./islamicAnalytics");
const analyzeJournal = require("./journalAnalytics");
const analyzeCalories = require("./calorieAnalytics");
const analyzeFitness = require("./fitnessAnalytics");
const analyzeHabits = require("./habitAnalytics");
const analyzeFinance = require("./financeAnalytics");

const normalizeRange = (range = "30d") => {
  const allowed = new Set(["today", "7d", "30d", "90d", "year"]);
  return allowed.has(range) ? range : "30d";
};

const toDayStart = (value = new Date()) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDayEnd = (value = new Date()) => {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
};

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);
const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getWindowFromRange = (range) => {
  const normalized = normalizeRange(range);
  const end = toDayEnd(new Date());
  const start = toDayStart(new Date());
  let days = 30;

  if (normalized === "today") days = 1;
  if (normalized === "7d") days = 7;
  if (normalized === "90d") days = 90;
  if (normalized === "year") days = 365;

  start.setDate(start.getDate() - (days - 1));

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);

  return { range: normalized, days, start, end, prevStart, prevEnd };
};

const listDays = (start, days) => {
  const items = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    items.push(toDateKey(d));
  }
  return items;
};

const calcChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return round(((current - previous) / previous) * 100, 1);
};

const getMoodScore = (mood) => {
  const map = {
    happy: 90,
    excited: 88,
    grateful: 86,
    motivated: 82,
    calm: 75,
    neutral: 60,
    anxious: 42,
    stressed: 35,
    sad: 30,
  };
  return map[mood] || 55;
};

const calcTrendDirection = (values) => {
  if (values.length < 2) return "stable";
  const first = Number(values[0] || 0);
  const last = Number(values[values.length - 1] || 0);
  if (last > first) return "up";
  if (last < first) return "down";
  return "stable";
};

const getStreakFromDateKeys = (keys, fromDate = new Date()) => {
  const set = new Set(keys);
  let streak = 0;
  const cursor = toDayStart(fromDate);

  while (set.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const getOverlapSeconds = (entryStart, entryEnd, rangeStart, rangeEnd) => {
  const left = Math.max(new Date(entryStart).getTime(), rangeStart.getTime());
  const right = Math.min(new Date(entryEnd).getTime(), rangeEnd.getTime());
  if (right <= left) return 0;
  return Math.floor((right - left) / 1000);
};

const toBDT = (entry) => {
  const converted = Number(entry?.convertedAmountBDT);
  if (!Number.isNaN(converted) && converted > 0) {
    return converted;
  }
  return Number(entry?.amount || 0) * Number(entry?.exchangeRate || 1);
};

const convertFromBDT = (amountBDT, targetCurrency, rates) => {
  if (targetCurrency === "BDT") return amountBDT;
  if (targetCurrency === "USD") return amountBDT / Number(rates.USD || 1);
  if (targetCurrency === "SAR") return amountBDT / Number(rates.SAR || 1);
  return amountBDT;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const getDefaultPreferences = () => ({
  weights: {},
  currency: "BDT",
  layout: "balanced",
});

const getUserPreferences = async (userId) => {
  const user = await User.findById(userId)
    .select("dashboardPreferences")
    .lean();

  return {
    ...(getDefaultPreferences() || {}),
    ...(user?.dashboardPreferences || {}),
  };
};

const updateUserPreferences = async (userId, nextPreferences = {}) => {
  const current = await getUserPreferences(userId);
  const merged = {
    ...current,
    ...nextPreferences,
    weights: {
      ...(current.weights || {}),
      ...(nextPreferences.weights || {}),
    },
  };

  if (!["BDT", "USD", "SAR"].includes(merged.currency)) {
    merged.currency = "BDT";
  }
  if (!["compact", "balanced", "detailed"].includes(merged.layout)) {
    merged.layout = "balanced";
  }

  await User.findByIdAndUpdate(userId, {
    dashboardPreferences: merged,
  });

  return merged;
};

const fetchDomainData = async ({ userId, window, comparePrevious }) => {
  const queries = [
    TimeTracker.find({
      userId,
      startTime: { $lt: window.end },
      endTime: { $gt: window.start },
    }).lean(),
    Study.find({
      userId,
      date: { $gte: window.start, $lte: window.end },
    }).lean(),
    IslamicTracker.find({
      userId,
      date: { $gte: window.start, $lte: window.end },
    }).lean(),
    Journal.find({ userId, date: { $gte: window.start, $lte: window.end } })
      .sort({ date: -1 })
      .lean(),
    CalorieTracker.find({
      userId,
      date: { $gte: window.start, $lte: window.end },
    }).lean(),
    FitnessTracker.find({
      userId,
      date: { $gte: window.start, $lte: window.end },
    }).lean(),
    UserHabit.find({ userId, active: true }).lean(),
    HabitLog.find({
      userId,
      date: {
        $gte: toDayStart(new Date(Date.now() - 364 * 86400000)),
        $lte: window.end,
      },
    }).lean(),
    FinanceTracker.find({
      userId,
      date: { $gte: window.start, $lte: window.end },
    }).lean(),
    getRatesForDate(new Date()),
    TimeTracker.find({
      userId,
      startTime: { $lt: window.end },
      endTime: {
        $gt: new Date(window.start.getFullYear(), window.start.getMonth(), 1),
      },
    }).lean(),
  ];

  if (comparePrevious) {
    queries.push(
      TimeTracker.find({
        userId,
        startTime: { $lt: window.prevEnd },
        endTime: { $gt: window.prevStart },
      }).lean(),
      Study.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
      IslamicTracker.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
      Journal.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
      CalorieTracker.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
      FitnessTracker.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
      HabitLog.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
      FinanceTracker.find({
        userId,
        date: { $gte: window.prevStart, $lte: window.prevEnd },
      }).lean(),
    );
  }

  const result = await Promise.all(queries);
  return {
    time: result[0],
    study: result[1],
    islamic: result[2],
    journal: result[3],
    calories: result[4],
    fitness: result[5],
    habits: result[6],
    habitLogs: result[7],
    finance: result[8],
    rates: result[9],
    timeForMonthCalc: result[10],
    previous: comparePrevious
      ? {
          time: result[11],
          study: result[12],
          islamic: result[13],
          journal: result[14],
          calories: result[15],
          fitness: result[16],
          habitLogs: result[17],
          finance: result[18],
        }
      : {
          time: [],
          study: [],
          islamic: [],
          journal: [],
          calories: [],
          fitness: [],
          habitLogs: [],
          finance: [],
        },
  };
};

const buildHeatmaps = ({ domain, context }) => {
  const heatmapDays = listDays(context.heatmapStart, context.heatmapDays);

  const studySet = new Set(domain.study.map((entry) => toDateKey(entry.date)));
  const prayerMap = new Map();
  domain.islamic.forEach((entry) => {
    const performed = ["fajr", "dhuhr", "asr", "maghrib", "isha"].filter(
      (name) =>
        entry?.salah?.[name]?.status === "PERFORMED" ||
        entry?.salah?.[name] === true,
    ).length;
    prayerMap.set(toDateKey(entry.date), Math.round((performed / 5) * 100));
  });
  const workoutSet = new Set(
    domain.fitness.map((entry) => toDateKey(entry.date)),
  );

  return {
    study: heatmapDays.map((date) => ({
      date,
      level: studySet.has(date) ? "excellent" : "none",
      value: studySet.has(date) ? 100 : 0,
    })),
    prayer: heatmapDays.map((date) => {
      const value = prayerMap.get(date) || 0;
      return {
        date,
        level:
          value >= 80
            ? "excellent"
            : value >= 40
              ? "medium"
              : value > 0
                ? "low"
                : "none",
        value,
      };
    }),
    habit: (domain.habits.charts?.heatmap || []).map((entry) => ({
      date: entry.date,
      level:
        entry.completion >= 80
          ? "excellent"
          : entry.completion >= 40
            ? "medium"
            : entry.completion > 0
              ? "low"
              : "none",
      value: entry.completion,
    })),
    workout: heatmapDays.map((date) => ({
      date,
      level: workoutSet.has(date) ? "excellent" : "none",
      value: workoutSet.has(date) ? 100 : 0,
    })),
  };
};

const buildWeeklyReview = ({ analytics, comparePrevious }) => {
  const isSunday = new Date().getDay() === 0;
  if (!isSunday) {
    return {
      show: false,
      achievements: [],
      improvements: [],
      challenges: [],
      nextWeekGoals: [],
    };
  }

  const achievements = [
    `Completed ${analytics.fitness.summary.totalWorkouts} workouts`,
    `Maintained ${analytics.habits.summary.completionRate}% habit completion`,
    `Prayed with ${analytics.islamic.summary.prayerScore}% consistency`,
  ];

  const improvements = [];
  if (comparePrevious) {
    if (analytics.study.score.changedByPercent > 0) {
      improvements.push(
        `Study increased by ${Math.abs(analytics.study.score.changedByPercent)}%`,
      );
    }
    if (analytics.time.score.changedByPercent > 0) {
      improvements.push(
        `Productive time increased by ${Math.abs(analytics.time.score.changedByPercent)}%`,
      );
    }
  }

  const challenges = [];
  if (analytics.finance.score.changedByPercent > 0) {
    challenges.push("Expenses increased compared to previous period");
  }
  if (analytics.calories.summary.status === "surplus") {
    challenges.push("Calorie intake is above maintenance");
  }

  return {
    show: true,
    achievements,
    improvements,
    challenges,
    nextWeekGoals: [
      "Maintain 80% habit completion",
      "Study 15 hours",
      "Save 10% of income",
    ],
  };
};

const buildScoreBreakdown = ({ analytics, lifeScore }) => {
  const dimensions = {
    Islamic: analytics.islamic.score.value,
    Health: analytics.calories.score.value,
    Study: analytics.study.score.value,
    Fitness: analytics.fitness.score.value,
    Habits: analytics.habits.score.value,
    Finance: analytics.finance.score.value,
    Journal: analytics.journal.score.value,
  };

  const sorted = Object.entries(dimensions).sort((a, b) => a[1] - b[1]);
  const lowered = sorted
    .slice(0, 2)
    .map(([name, value]) => `- ${name} contributed only ${value}%`);
  const improved = sorted
    .slice(-2)
    .reverse()
    .map(([name, value]) => `+ ${name} performed strongly at ${value}%`);

  return {
    lifeScore: `${lifeScore.score}/100`,
    dimensions,
    lowered,
    improved,
  };
};

const buildAICoach = ({ userName, analytics, comparePrevious }) => {
  const studyChange = analytics.study.score.changedByPercent;
  const productivityChange = analytics.time.score.changedByPercent;

  const intro = `Assalamu Alaikum ${userName || "Friend"} 👋`;

  const diagnosis = comparePrevious
    ? `Your productivity ${
        productivityChange < 0 ? "dropped" : "improved"
      } ${Math.abs(productivityChange)}% this period, and study changed ${Math.abs(studyChange)}%.`
    : `Your current life score is ${analytics.lifeScore.score}. Keep a steady daily rhythm.`;

  const focus = [
    "Complete 2 hours study",
    "Walk 5000 steps",
    "Read 5 Quran pages",
    "Avoid 300 extra calories",
  ];

  return {
    intro,
    diagnosis,
    priorities: [
      { label: "high", text: focus[0] },
      { label: "high", text: focus[2] },
      { label: "medium", text: focus[1] },
      { label: "medium", text: focus[3] },
    ],
  };
};

const buildOverviewCards = ({ analytics, currency }) => {
  return [
    {
      key: "productivity",
      label: "Productivity Score",
      value: `${Math.round(analytics.time.score.value)}%`,
      delta: analytics.time.score.changedByPercent,
      status: analytics.time.score.value >= 70 ? "Focused" : "Improve focus",
    },
    {
      key: "study",
      label: "Study Hours",
      value: `${analytics.study.summary.totalHours}h`,
      delta: analytics.study.score.changedByPercent,
      status:
        analytics.study.summary.currentStreak >= 3
          ? "Strong streak"
          : "Rebuild streak",
    },
    {
      key: "islamic",
      label: "Islamic Consistency",
      value: `${Math.round(analytics.islamic.summary.consistencyScore)}%`,
      delta: analytics.islamic.score.changedByPercent,
      status:
        analytics.islamic.summary.consistencyScore >= 80
          ? "Consistent"
          : "Keep building",
    },
    {
      key: "calories",
      label: "Calories Balance",
      value: `${analytics.calories.summary.netCalories >= 0 ? "+" : ""}${analytics.calories.summary.netCalories} kcal`,
      delta: analytics.calories.score.changedByPercent,
      status: analytics.calories.summary.status,
    },
    {
      key: "fitness",
      label: "Workout Progress",
      value: `${analytics.fitness.summary.totalWorkouts} workouts`,
      delta: analytics.fitness.score.changedByPercent,
      status:
        analytics.fitness.summary.workoutConsistency >= 50
          ? "Consistent"
          : "Needs routine",
    },
    {
      key: "habits",
      label: "Habit Completion",
      value: `${analytics.habits.summary.completionRate}%`,
      delta: analytics.habits.score.changedByPercent,
      status:
        analytics.habits.summary.completionRate >= 70
          ? "Reliable"
          : "Inconsistent",
    },
    {
      key: "finance",
      label: "Financial Overview",
      value: `${currency} ${round(analytics.finance.summary.savings, 0)}`,
      delta: analytics.finance.score.changedByPercent,
      status: analytics.finance.summary.balance >= 0 ? "Positive" : "Negative",
    },
    {
      key: "journal",
      label: "Journal Mood Trend",
      value: `${analytics.journal.summary.moodAverage || 0}%`,
      delta: analytics.journal.score.changedByPercent,
      status:
        analytics.journal.summary.moodTrend === "up"
          ? "Improving"
          : "Watch trend",
    },
  ];
};

const buildComparison = ({ analytics, comparePrevious }) => {
  if (!comparePrevious) {
    return { enabled: false };
  }

  return {
    enabled: true,
    study: {
      current: analytics.study.summary.totalHours,
      previous: analytics.study.summary.previousHours,
      change: analytics.study.score.changedByPercent,
    },
    productivity: {
      current: analytics.time.summary.totalHours,
      previous: analytics.time.summary.previousHours,
      change: analytics.time.score.changedByPercent,
    },
    fitness: {
      current: analytics.fitness.summary.totalWorkouts,
      previous: analytics.fitness.summary.previousWorkouts,
      change: analytics.fitness.score.changedByPercent,
    },
    finance: {
      current: analytics.finance.summary.expense,
      previous: analytics.finance.summary.previousExpense,
      change: analytics.finance.score.changedByPercent,
    },
  };
};

const buildTodaySnapshot = ({ analytics }) => {
  const wins = [];
  const warnings = [];
  const recommendations = [];

  if (analytics.islamic.summary.prayerScore >= 80) {
    wins.push("Completed most daily prayers");
  }
  if (analytics.calories.summary.status === "deficit") {
    wins.push("Maintained calorie deficit");
  }
  if (analytics.study.summary.totalHours >= 2) {
    wins.push("Finished study goal");
  }

  if (analytics.calories.summary.status === "surplus") {
    warnings.push("Calories above maintenance");
  }
  if (analytics.finance.score.changedByPercent > 10) {
    warnings.push("Expense trend higher than average");
  }
  if (analytics.time.summary.todayHours < 4) {
    warnings.push("Low productivity hours today");
  }

  recommendations.push("Read Quran for 15 minutes");
  recommendations.push("Take a 20 minute walk");
  recommendations.push("Plan 2 focused work blocks");

  return {
    date: new Date().toISOString().slice(0, 10),
    lifeScore: analytics.lifeScore,
    wins,
    warnings,
    recommendations,
  };
};

const buildDashboardAnalytics = async ({
  userId,
  range,
  currency,
  comparePrevious,
  maintenanceCalories,
}) => {
  const user = await User.findById(userId)
    .select("username dashboardPreferences")
    .lean();

  const preferences = {
    ...getDefaultPreferences(),
    ...(user?.dashboardPreferences || {}),
  };

  const selectedCurrency = ["BDT", "USD", "SAR"].includes(currency)
    ? currency
    : preferences.currency || "BDT";

  const window = getWindowFromRange(range || "30d");
  const domain = await fetchDomainData({ userId, window, comparePrevious });

  const heatmapStart = toDayStart(new Date(Date.now() - 364 * 86400000));

  const context = {
    round,
    clamp,
    toDateKey,
    toDayStart,
    toDayEnd,
    listDays,
    calcChange,
    getMoodScore,
    calcTrendDirection,
    getStreakFromDateKeys,
    getOverlapSeconds,
    toBDT,
    convertFromBDT,
    rates: domain.rates,
    currency: selectedCurrency,
    window,
    heatmapStart,
    heatmapDays: 365,
    maintenanceCalories,
    activeHabits: domain.habits,
    fitnessRangeData: domain.fitness,
    userName: user?.username,
  };

  const analytics = {
    time: analyzeTime({
      rangeData: domain.time,
      previousData: domain.previous.time,
      context,
      window,
      monthData: domain.timeForMonthCalc,
    }),
    study: analyzeStudy({
      rangeData: domain.study,
      previousData: domain.previous.study,
      context,
      window,
    }),
    islamic: analyzeIslamic({
      rangeData: domain.islamic,
      previousData: domain.previous.islamic,
      context,
      window,
    }),
    journal: analyzeJournal({
      rangeData: domain.journal,
      previousData: domain.previous.journal,
      context,
      window,
    }),
    calories: analyzeCalories({
      rangeData: domain.calories,
      previousData: domain.previous.calories,
      context,
      window,
    }),
    fitness: analyzeFitness({
      rangeData: domain.fitness,
      previousData: domain.previous.fitness,
      context,
      window,
    }),
    habits: analyzeHabits({
      rangeData: domain.habitLogs,
      previousData: domain.previous.habitLogs,
      context,
      window,
    }),
    finance: analyzeFinance({
      rangeData: domain.finance,
      previousData: domain.previous.finance,
      context,
      window,
    }),
  };

  const lifeScore = computeLifeScore(
    {
      islamic: analytics.islamic.score.value,
      health: analytics.calories.score.value,
      fitness: analytics.fitness.score.value,
      study: analytics.study.score.value,
      habits: analytics.habits.score.value,
      finance: analytics.finance.score.value,
      journal: analytics.journal.score.value,
    },
    preferences.weights,
  );

  analytics.lifeScore = lifeScore;

  const allInsights = [
    ...analytics.time.insights,
    ...analytics.study.insights,
    ...analytics.islamic.insights,
    ...analytics.journal.insights,
    ...analytics.calories.insights,
    ...analytics.fitness.insights,
    ...analytics.habits.insights,
    ...analytics.finance.insights,
  ];

  const hasAnyData =
    domain.time.length +
      domain.study.length +
      domain.islamic.length +
      domain.journal.length +
      domain.calories.length +
      domain.fitness.length +
      domain.habitLogs.length +
      domain.finance.length >
    0;

  const scoreBreakdown = buildScoreBreakdown({ analytics, lifeScore });
  const aiCoach = buildAICoach({
    userName: context.userName,
    analytics,
    comparePrevious,
  });

  const weeklyReview = buildWeeklyReview({ analytics, comparePrevious });

  const overview = {
    greeting: getGreeting(),
    motivation: lifeScore.message,
    lifeScore,
    scoreBreakdown,
    streakSummary: {
      study: analytics.study.summary.currentStreak,
      journal: analytics.journal.summary.writingStreak,
      quran: analytics.islamic.summary.quranStreak,
      habits: analytics.habits.summary.longestStreak,
      bestCurrent: Math.max(
        analytics.study.summary.currentStreak,
        analytics.journal.summary.writingStreak,
        analytics.islamic.summary.quranStreak,
        analytics.habits.summary.longestStreak,
      ),
    },
    overviewCards: buildOverviewCards({
      analytics,
      currency: selectedCurrency,
    }),
    comparison: buildComparison({ analytics, comparePrevious }),
    productivity: analytics.time.summary,
    study: analytics.study.summary,
    islamic: analytics.islamic.summary,
    journal: analytics.journal.summary,
    calories: analytics.calories.summary,
    fitness: analytics.fitness.summary,
    habits: analytics.habits.summary,
    finance: analytics.finance.summary,
    health: {
      bmi: null,
      weightTrend: analytics.calories.summary.weightTrendPrediction,
      calorieTrend: analytics.calories.summary.weeklyAverageBalance,
      workoutConsistency: analytics.fitness.summary.workoutConsistency,
      sleep: null,
      summary:
        "Health summary is improving; sleep metrics will be integrated in a future update.",
    },
    weeklyReview,
    aiCoach,
    dashboardLayout: preferences.layout || "balanced",
  };

  const charts = {
    radarBalance: [
      { dimension: "Islamic", value: analytics.islamic.score.value },
      { dimension: "Study", value: analytics.study.score.value },
      { dimension: "Health", value: analytics.calories.score.value },
      { dimension: "Fitness", value: analytics.fitness.score.value },
      { dimension: "Finance", value: analytics.finance.score.value },
      { dimension: "Habits", value: analytics.habits.score.value },
      { dimension: "Productivity", value: analytics.time.score.value },
    ],
    time: analytics.time.charts,
    study: analytics.study.charts,
    islamic: analytics.islamic.charts,
    journal: analytics.journal.charts,
    calories: analytics.calories.charts,
    fitness: analytics.fitness.charts,
    habits: analytics.habits.charts,
    finance: analytics.finance.charts,
    heatmaps: buildHeatmaps({
      domain: { ...domain, habits: analytics.habits },
      context,
    }),
  };

  const snapshot = buildTodaySnapshot({ analytics });

  return {
    generatedAt: new Date().toISOString(),
    range: window.range,
    hasAnyData,
    emptyState: hasAnyData
      ? null
      : {
          title: "Start building your LifeOS",
          actions: [
            "Complete first workout",
            "Log your first journal",
            "Track your first habit",
            "Record your first expense",
          ],
        },
    overview,
    charts,
    insights: allInsights,
    rates: {
      USD_BDT: round(Number(domain.rates.USD || 0), 2),
      SAR_BDT: round(Number(domain.rates.SAR || 0), 2),
      updatedAt: new Date().toISOString(),
    },
    snapshot,
    preferences,
  };
};

module.exports = {
  buildDashboardAnalytics,
  buildTodaySnapshot,
  getUserPreferences,
  updateUserPreferences,
};
