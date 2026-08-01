const TimeTracker = require("../models/TimeTracker");
const Study = require("../models/Study");
const IslamicTracker = require("../models/IslamicTracker");
const Journal = require("../models/Journal");
const CalorieTracker = require("../models/CalorieTracker");
const FitnessTracker = require("../models/FitnessTracker");
const UserHabit = require("../models/UserHabit");
const HabitLog = require("../models/HabitLog");
const FinanceTracker = require("../models/FinanceTracker");
const { getRatesForDate } = require("../services/currencyService");

const SALAH_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const PRODUCTIVE_TIME_CATEGORIES = new Set([
  "study",
  "work",
  "exercise",
  "learning",
  "project",
  "deep work",
]);

const toDayStart = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toDayEnd = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const formatDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const getRangeWindow = (range = "30d") => {
  const end = toDayEnd(new Date());
  const start = toDayStart(new Date());
  let days = 30;

  if (range === "today") {
    days = 1;
  } else if (range === "7d") {
    days = 7;
  } else if (range === "year") {
    days = 365;
  }

  start.setDate(start.getDate() - (days - 1));

  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);
  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

  return {
    range,
    days,
    start,
    end,
    previousStart,
    previousEnd,
  };
};

const calcChange = (current, previous) => {
  if (!previous && !current) {
    return 0;
  }
  if (!previous) {
    return 100;
  }
  return round(((current - previous) / previous) * 100, 1);
};

const createDailySkeleton = (start, days) => {
  const list = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    list.push({ date: formatDateKey(d), value: 0 });
  }
  return list;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
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
  if (targetCurrency === "SAR") return amountBDT / Number(rates.SAR || 1);
  if (targetCurrency === "USD") return amountBDT / Number(rates.USD || 1);
  return amountBDT;
};

const dashboardController = {
  getOverview: async (req, res) => {
    try {
      const { range = "30d", currency = "BDT" } = req.query;
      const selectedCurrency = ["BDT", "SAR", "USD"].includes(currency)
        ? currency
        : "BDT";
      const window = getRangeWindow(range);

      const [
        timeEntries,
        prevTimeEntries,
        studySessions,
        prevStudySessions,
        islamicTrackers,
        prevIslamicTrackers,
        journals,
        prevJournals,
        calories,
        prevCalories,
        fitness,
        prevFitness,
        activeHabits,
        habitLogs,
        prevHabitLogs,
        finance,
        prevFinance,
        rates,
      ] = await Promise.all([
        TimeTracker.find({
          userId: req.userId,
          startTime: { $lt: window.end },
          endTime: { $gt: window.start },
        }).lean(),
        TimeTracker.find({
          userId: req.userId,
          startTime: { $lt: window.previousEnd },
          endTime: { $gt: window.previousStart },
        }).lean(),
        Study.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        Study.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        IslamicTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        IslamicTracker.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        Journal.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        })
          .sort({ date: -1 })
          .lean(),
        Journal.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        CalorieTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        CalorieTracker.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        FitnessTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        FitnessTracker.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        UserHabit.find({ userId: req.userId, active: true }).lean(),
        HabitLog.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        HabitLog.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        FinanceTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        FinanceTracker.find({
          userId: req.userId,
          date: { $gte: window.previousStart, $lte: window.previousEnd },
        }).lean(),
        getRatesForDate(new Date()),
      ]);

      const timeTotalHours = round(
        timeEntries.reduce(
          (sum, item) => sum + Number(item.durationSeconds || 0),
          0,
        ) / 3600,
      );
      const prevTimeTotalHours = round(
        prevTimeEntries.reduce(
          (sum, item) => sum + Number(item.durationSeconds || 0),
          0,
        ) / 3600,
      );

      const productiveHours = round(
        timeEntries.reduce((sum, item) => {
          const category = String(item.category || "").toLowerCase();
          const isProductive =
            PRODUCTIVE_TIME_CATEGORIES.has(category) ||
            category.includes("study") ||
            category.includes("work") ||
            category.includes("exercise");
          return isProductive
            ? sum + Number(item.durationSeconds || 0) / 3600
            : sum;
        }, 0),
      );

      const prevProductiveHours = round(
        prevTimeEntries.reduce((sum, item) => {
          const category = String(item.category || "").toLowerCase();
          const isProductive =
            PRODUCTIVE_TIME_CATEGORIES.has(category) ||
            category.includes("study") ||
            category.includes("work") ||
            category.includes("exercise");
          return isProductive
            ? sum + Number(item.durationSeconds || 0) / 3600
            : sum;
        }, 0),
      );

      const studyHours = round(
        studySessions.reduce(
          (sum, item) => sum + Number(item.duration || 0),
          0,
        ) / 60,
      );
      const prevStudyHours = round(
        prevStudySessions.reduce(
          (sum, item) => sum + Number(item.duration || 0),
          0,
        ) / 60,
      );
      const subjectTotals = studySessions.reduce((acc, item) => {
        const key = item.subject || "Other";
        acc[key] = (acc[key] || 0) + Number(item.duration || 0);
        return acc;
      }, {});
      const topSubject = Object.entries(subjectTotals).sort(
        (a, b) => b[1] - a[1],
      )[0];

      const getPerformedSalahCount = (entries) =>
        entries.reduce((sum, entry) => {
          const salah = entry.salah || {};
          return (
            sum +
            SALAH_NAMES.filter(
              (name) =>
                salah[name]?.status === "PERFORMED" || salah[name] === true,
            ).length
          );
        }, 0);

      const performedSalah = getPerformedSalahCount(islamicTrackers);
      const prevPerformedSalah = getPerformedSalahCount(prevIslamicTrackers);
      const totalSalahTargets = islamicTrackers.length * 5;
      const prevTotalSalahTargets = prevIslamicTrackers.length * 5;
      const prayerConsistency = totalSalahTargets
        ? round((performedSalah / totalSalahTargets) * 100)
        : 0;
      const prevPrayerConsistency = prevTotalSalahTargets
        ? round((prevPerformedSalah / prevTotalSalahTargets) * 100)
        : 0;

      const quranPages = islamicTrackers.reduce(
        (sum, entry) => sum + Number(entry.quranPages || 0),
        0,
      );
      const prevQuranPages = prevIslamicTrackers.reduce(
        (sum, entry) => sum + Number(entry.quranPages || 0),
        0,
      );

      const moodScoreMap = {
        happy: 90,
        excited: 88,
        grateful: 85,
        motivated: 82,
        calm: 75,
        neutral: 60,
        anxious: 40,
        stressed: 35,
        sad: 30,
      };
      const journalMoodAverage = journals.length
        ? round(
            journals.reduce(
              (sum, entry) => sum + Number(moodScoreMap[entry.mood] || 55),
              0,
            ) / journals.length,
          )
        : 0;
      const prevJournalMoodAverage = prevJournals.length
        ? round(
            prevJournals.reduce(
              (sum, entry) => sum + Number(moodScoreMap[entry.mood] || 55),
              0,
            ) / prevJournals.length,
          )
        : 0;

      const journalDays = new Set(
        journals.map((entry) => formatDateKey(entry.date)),
      );
      let journalStreak = 0;
      let cursor = toDayStart(new Date());
      while (journalDays.has(formatDateKey(cursor))) {
        journalStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      const consumedCalories = round(
        calories.reduce((sum, item) => sum + Number(item.calories || 0), 0),
      );
      const prevConsumedCalories = round(
        prevCalories.reduce((sum, item) => sum + Number(item.calories || 0), 0),
      );
      const burnedCalories = round(
        fitness.reduce(
          (sum, item) => sum + Number(item.caloriesBurned || 0),
          0,
        ),
      );
      const prevBurnedCalories = round(
        prevFitness.reduce(
          (sum, item) => sum + Number(item.caloriesBurned || 0),
          0,
        ),
      );
      const netCalories = consumedCalories - burnedCalories;

      const workoutCount = fitness.length;
      const prevWorkoutCount = prevFitness.length;
      const workoutDuration = round(
        fitness.reduce((sum, item) => sum + Number(item.duration || 0), 0),
      );
      const muscleGroups = new Set(
        fitness.flatMap((item) => item.targetMuscles || []).filter(Boolean),
      );

      const habitIds = activeHabits.map((item) => String(item._id));
      const completedLogs = habitLogs.filter(
        (log) => log.completed && habitIds.includes(String(log.habitId)),
      );
      const prevCompletedLogs = prevHabitLogs.filter(
        (log) => log.completed && habitIds.includes(String(log.habitId)),
      );
      const expectedCompletions = activeHabits.length * window.days;
      const prevExpectedCompletions = activeHabits.length * window.days;
      const habitCompletion = expectedCompletions
        ? round((completedLogs.length / expectedCompletions) * 100)
        : 0;
      const prevHabitCompletion = prevExpectedCompletions
        ? round((prevCompletedLogs.length / prevExpectedCompletions) * 100)
        : 0;

      const habitCompletionByHabit = activeHabits.map((habit) => {
        const habitId = String(habit._id);
        const completedCount = completedLogs.filter(
          (log) => String(log.habitId) === habitId,
        ).length;
        const completionPercentage = window.days
          ? round((completedCount / window.days) * 100)
          : 0;
        return {
          name: habit.name,
          completionPercentage,
        };
      });
      const strongestHabit = habitCompletionByHabit
        .slice()
        .sort((a, b) => b.completionPercentage - a.completionPercentage)[0];
      const weakestHabit = habitCompletionByHabit
        .slice()
        .sort((a, b) => a.completionPercentage - b.completionPercentage)[0];

      const incomeBDT = finance
        .filter((entry) => entry.type === "income")
        .reduce((sum, entry) => sum + toBDT(entry), 0);
      const expenseBDT = finance
        .filter((entry) => entry.type === "expense")
        .reduce((sum, entry) => sum + toBDT(entry), 0);
      const prevIncomeBDT = prevFinance
        .filter((entry) => entry.type === "income")
        .reduce((sum, entry) => sum + toBDT(entry), 0);
      const prevExpenseBDT = prevFinance
        .filter((entry) => entry.type === "expense")
        .reduce((sum, entry) => sum + toBDT(entry), 0);
      const savingsBDT = incomeBDT - expenseBDT;
      const savingsRate =
        incomeBDT > 0 ? round((savingsBDT / incomeBDT) * 100) : 0;

      const topFinanceCategory = Object.entries(
        finance
          .filter((entry) => entry.type === "expense")
          .reduce((acc, entry) => {
            const key = entry.category || "Other";
            acc[key] = (acc[key] || 0) + toBDT(entry);
            return acc;
          }, {}),
      ).sort((a, b) => b[1] - a[1])[0];

      const productivityScore = clamp(
        Math.round((productiveHours / (window.days * 6)) * 100),
        0,
        100,
      );
      const studyScore = clamp(
        Math.round((studyHours / (window.days * 2)) * 100),
        0,
        100,
      );
      const islamicScore = clamp(Math.round(prayerConsistency), 0, 100);
      const caloriesScore = clamp(
        Math.round(
          100 - Math.min(Math.abs(netCalories / window.days) / 8, 100),
        ),
        0,
        100,
      );
      const fitnessScore = clamp(
        Math.round(
          (workoutCount / Math.max(1, Math.round((window.days / 7) * 4))) * 100,
        ),
        0,
        100,
      );
      const habitScore = clamp(Math.round(habitCompletion), 0, 100);
      const financeScore = clamp(Math.round((savingsRate + 100) / 2), 0, 100);
      const journalScore = clamp(Math.round(journalMoodAverage), 0, 100);

      const lifeScore = round(
        [
          productivityScore,
          studyScore,
          islamicScore,
          caloriesScore,
          fitnessScore,
          habitScore,
          financeScore,
          journalScore,
        ].reduce((sum, value) => sum + value, 0) / 8,
      );

      const convertedIncome = round(
        convertFromBDT(incomeBDT, selectedCurrency, rates),
        2,
      );
      const convertedExpense = round(
        convertFromBDT(expenseBDT, selectedCurrency, rates),
        2,
      );
      const convertedSavings = round(
        convertFromBDT(savingsBDT, selectedCurrency, rates),
        2,
      );

      const insights = [];
      if (productiveHours > prevProductiveHours) {
        insights.push(
          `Productive time improved by ${Math.max(0, calcChange(productiveHours, prevProductiveHours))}% versus the previous period.`,
        );
      }
      if (
        burnedCalories > prevBurnedCalories &&
        consumedCalories > prevConsumedCalories
      ) {
        insights.push(
          "You exercised more, but calorie intake also increased. Consider tightening meal quality for better net results.",
        );
      }
      if (quranPages > prevQuranPages) {
        insights.push(
          `Quran reading increased by ${Math.max(0, calcChange(quranPages, prevQuranPages))}% compared to the previous period.`,
        );
      }
      if (topFinanceCategory?.[0]) {
        insights.push(
          `Your highest spending category is ${topFinanceCategory[0]}.`,
        );
      }
      if (insights.length === 0) {
        insights.push(
          "Keep logging daily. More data unlocks better LifeOS intelligence insights.",
        );
      }

      const overviewCards = [
        {
          key: "productivity",
          label: "Productivity Score",
          value: `${productivityScore}%`,
          delta: calcChange(productiveHours, prevProductiveHours),
          status:
            productiveHours >= prevProductiveHours
              ? "Improving"
              : "Needs focus",
        },
        {
          key: "study",
          label: "Study Hours",
          value: `${studyHours}h`,
          delta: calcChange(studyHours, prevStudyHours),
          status:
            studyHours >= prevStudyHours
              ? "Strong momentum"
              : "Below previous period",
        },
        {
          key: "islamic",
          label: "Prayer Consistency",
          value: `${prayerConsistency}%`,
          delta: calcChange(prayerConsistency, prevPrayerConsistency),
          status:
            prayerConsistency >= 85 ? "Excellent consistency" : "Can improve",
        },
        {
          key: "calories",
          label: "Calories Balance",
          value: `${netCalories >= 0 ? "+" : ""}${round(netCalories, 0)} kcal`,
          delta: calcChange(consumedCalories, prevConsumedCalories),
          status: netCalories <= 0 ? "Deficit" : "Surplus",
        },
        {
          key: "fitness",
          label: "Workout Progress",
          value: `${workoutCount} workouts`,
          delta: calcChange(workoutCount, prevWorkoutCount),
          status:
            workoutCount >= prevWorkoutCount
              ? "More consistent"
              : "Slower than before",
        },
        {
          key: "habits",
          label: "Habit Completion",
          value: `${habitCompletion}%`,
          delta: calcChange(habitCompletion, prevHabitCompletion),
          status:
            habitCompletion >= 70 ? "Good discipline" : "Build consistency",
        },
        {
          key: "finance",
          label: "Financial Overview",
          value: `${selectedCurrency} ${round(convertedSavings, 0)}`,
          delta: calcChange(savingsBDT, prevIncomeBDT - prevExpenseBDT),
          status: savingsBDT >= 0 ? "Positive balance" : "Negative balance",
        },
        {
          key: "journal",
          label: "Journal Mood Trend",
          value: `${journalMoodAverage}%`,
          delta: calcChange(journalMoodAverage, prevJournalMoodAverage),
          status: journalMoodAverage >= 65 ? "Mood improving" : "Reflect more",
        },
      ];

      res.json({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          range: window.range,
          greeting: getGreeting(),
          lifeScore,
          motivation:
            lifeScore >= 80
              ? "Great progress. Keep improving your consistency."
              : "You are building momentum. Small daily actions will compound.",
          overviewCards,
          productivity: {
            totalHours: timeTotalHours,
            productiveHours,
            weeklyProductiveHours: productiveHours,
            monthlyComparisonPercent: calcChange(
              timeTotalHours,
              prevTimeTotalHours,
            ),
            mostUsedActivities: Object.entries(
              timeEntries.reduce((acc, entry) => {
                const taskName = entry?.task?.name || "Untitled Task";
                acc[taskName] =
                  (acc[taskName] || 0) + Number(entry.durationSeconds || 0);
                return acc;
              }, {}),
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, seconds]) => ({
                name,
                hours: round(seconds / 3600),
              })),
            summary: `You spent ${productiveHours} hours on productive activities this period.`,
          },
          study: {
            totalHours: studyHours,
            subjectsStudied: Object.keys(subjectTotals).length,
            currentStreak: 0,
            weeklyGoalCompletion: clamp(
              Math.round(
                (studyHours / Math.max(1, (window.days / 7) * 14)) * 100,
              ),
              0,
              100,
            ),
            topSubject: topSubject
              ? { name: topSubject[0], hours: round(topSubject[1] / 60) }
              : null,
            summary: topSubject
              ? `You studied ${studyHours} hours. ${topSubject[0]} received the most attention with ${round(topSubject[1] / 60)} hours.`
              : "Start logging study sessions to unlock subject insights.",
          },
          islamic: {
            salahCompletion: prayerConsistency,
            quranPages,
            fastingDays: islamicTrackers.filter((entry) => entry.fasting)
              .length,
            dhikrCount: islamicTrackers.reduce(
              (sum, entry) =>
                sum + (Array.isArray(entry.adhkar) ? entry.adhkar.length : 0),
              0,
            ),
            summary: `You completed ${prayerConsistency}% of prayers and read ${quranPages} Quran pages.`,
          },
          journal: {
            totalEntries: journals.length,
            writingStreak: journalStreak,
            moodScore: journalMoodAverage,
            averageWordsPerDay: round(
              journals.reduce(
                (sum, entry) =>
                  sum +
                  String(entry.notes || "")
                    .split(/\s+/)
                    .filter(Boolean).length,
                0,
              ) / Math.max(1, window.days),
            ),
            summary:
              journals.length > 0
                ? `You maintained a ${journalStreak}-day journaling streak. Your mood trend score is ${journalMoodAverage}%.`
                : "Add journal entries to generate mood and reflection trends.",
            recentEntries: journals.slice(0, 20),
          },
          calories: {
            consumedCalories,
            burnedCalories,
            netCalories,
            status: netCalories > 0 ? "surplus" : "deficit",
            message:
              netCalories > 0
                ? "You are currently in calorie surplus. Consider reducing intake or increasing activity."
                : "Great! You are maintaining a calorie deficit.",
            currentWeight:
              fitness
                .filter((item) => Number(item.weight || 0) > 0)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                ?.weight || null,
            targetWeight: null,
            progressPercentage: null,
          },
          fitness: {
            totalWorkouts: workoutCount,
            durationMinutes: workoutDuration,
            caloriesBurned: burnedCalories,
            strengthProgress: round(
              fitness
                .filter((item) => item.type === "strength")
                .reduce(
                  (sum, item) =>
                    sum + Number(item.sets || 0) * Number(item.reps || 0),
                  0,
                ),
              0,
            ),
            muscleGroupsTrained: muscleGroups.size,
            summary: `You completed ${workoutCount} workouts with ${burnedCalories} calories burned.`,
          },
          habits: {
            completion: habitCompletion,
            completed: round((habitCompletion / 100) * activeHabits.length, 0),
            incomplete: Math.max(
              0,
              activeHabits.length -
                round((habitCompletion / 100) * activeHabits.length, 0),
            ),
            strongestHabit,
            weakestHabit,
            summary: strongestHabit
              ? `Your strongest habit is ${strongestHabit.name} (${strongestHabit.completionPercentage}%).`
              : "Start tracking habits to reveal strengths and weak areas.",
          },
          finance: {
            currency: selectedCurrency,
            rates: {
              SAR_BDT: round(Number(rates.SAR || 0), 2),
              USD_BDT: round(Number(rates.USD || 0), 2),
            },
            income: convertedIncome,
            expense: convertedExpense,
            savings: convertedSavings,
            balance: convertedSavings,
            savingsRate,
            topCategory: topFinanceCategory
              ? {
                  name: topFinanceCategory[0],
                  amountBDT: round(topFinanceCategory[1], 2),
                }
              : null,
            summary: `This period you saved ${savingsRate}% of income.`,
          },
          insights,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to build dashboard overview",
        error: error.message,
      });
    }
  },

  getCharts: async (req, res) => {
    try {
      const { range = "30d", currency = "BDT" } = req.query;
      const selectedCurrency = ["BDT", "SAR", "USD"].includes(currency)
        ? currency
        : "BDT";
      const window = getRangeWindow(range);

      const [
        timeEntries,
        studySessions,
        islamicTrackers,
        journals,
        calories,
        fitness,
        activeHabits,
        habitLogs,
        finance,
        rates,
      ] = await Promise.all([
        TimeTracker.find({
          userId: req.userId,
          startTime: { $lt: window.end },
          endTime: { $gt: window.start },
        }).lean(),
        Study.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        IslamicTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        Journal.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        CalorieTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        FitnessTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        UserHabit.find({ userId: req.userId, active: true }).lean(),
        HabitLog.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        FinanceTracker.find({
          userId: req.userId,
          date: { $gte: window.start, $lte: window.end },
        }).lean(),
        getRatesForDate(new Date()),
      ]);

      const dailyTime = createDailySkeleton(window.start, window.days);
      const dailyStudy = createDailySkeleton(window.start, window.days);
      const dailySalah = createDailySkeleton(window.start, window.days);
      const dailyQuran = createDailySkeleton(window.start, window.days);
      const dailyJournalMood = createDailySkeleton(window.start, window.days);
      const dailyConsumed = createDailySkeleton(window.start, window.days);
      const dailyBurned = createDailySkeleton(window.start, window.days);
      const dailyWorkouts = createDailySkeleton(window.start, window.days);
      const dailyHabit = createDailySkeleton(window.start, window.days);
      const dailyIncome = createDailySkeleton(window.start, window.days);
      const dailyExpense = createDailySkeleton(window.start, window.days);

      const dailyIndex = new Map(
        dailyTime.map((item, index) => [item.date, index]),
      );

      timeEntries.forEach((entry) => {
        const key = formatDateKey(entry.startTime);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        dailyTime[idx].value += Number(entry.durationSeconds || 0) / 3600;
      });

      studySessions.forEach((entry) => {
        const key = formatDateKey(entry.date);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        dailyStudy[idx].value += Number(entry.duration || 0) / 60;
      });

      islamicTrackers.forEach((entry) => {
        const key = formatDateKey(entry.date);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        const salahCount = SALAH_NAMES.filter(
          (name) =>
            entry?.salah?.[name]?.status === "PERFORMED" ||
            entry?.salah?.[name] === true,
        ).length;
        dailySalah[idx].value = (salahCount / 5) * 100;
        dailyQuran[idx].value += Number(entry.quranPages || 0);
      });

      const moodScoreMap = {
        happy: 90,
        excited: 88,
        grateful: 85,
        motivated: 82,
        calm: 75,
        neutral: 60,
        anxious: 40,
        stressed: 35,
        sad: 30,
      };
      journals.forEach((entry) => {
        const key = formatDateKey(entry.date);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        dailyJournalMood[idx].value = moodScoreMap[entry.mood] || 55;
      });

      calories.forEach((entry) => {
        const key = formatDateKey(entry.date);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        dailyConsumed[idx].value += Number(entry.calories || 0);
      });

      fitness.forEach((entry) => {
        const key = formatDateKey(entry.date);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        dailyBurned[idx].value += Number(entry.caloriesBurned || 0);
        dailyWorkouts[idx].value += 1;
      });

      const habitIds = new Set(activeHabits.map((item) => String(item._id)));
      const logsByDate = new Map();
      habitLogs.forEach((log) => {
        if (!log.completed || !habitIds.has(String(log.habitId))) return;
        const key = formatDateKey(log.date);
        logsByDate.set(key, (logsByDate.get(key) || 0) + 1);
      });
      dailyHabit.forEach((entry) => {
        const completed = logsByDate.get(entry.date) || 0;
        entry.value = activeHabits.length
          ? round((completed / activeHabits.length) * 100)
          : 0;
      });

      finance.forEach((entry) => {
        const key = formatDateKey(entry.date);
        const idx = dailyIndex.get(key);
        if (idx == null) return;
        const amount = convertFromBDT(toBDT(entry), selectedCurrency, rates);
        if (entry.type === "income") {
          dailyIncome[idx].value += amount;
        } else {
          dailyExpense[idx].value += amount;
        }
      });

      const timeDistributionRaw = timeEntries.reduce(
        (acc, entry) => {
          const category = String(entry.category || "other").toLowerCase();
          const seconds = Number(entry.durationSeconds || 0);
          if (category.includes("study")) acc.study += seconds;
          else if (category.includes("work")) acc.work += seconds;
          else if (category.includes("exercise")) acc.exercise += seconds;
          else if (category.includes("sleep")) acc.sleep += seconds;
          else acc.other += seconds;
          return acc;
        },
        { study: 0, work: 0, exercise: 0, sleep: 0, other: 0 },
      );

      const subjectDistribution = Object.entries(
        studySessions.reduce((acc, entry) => {
          const key = entry.subject || "Other";
          acc[key] = (acc[key] || 0) + Number(entry.duration || 0);
          return acc;
        }, {}),
      )
        .map(([name, minutes]) => ({ name, value: round(minutes / 60) }))
        .sort((a, b) => b.value - a.value);

      const workoutCategoryDistribution = Object.entries(
        fitness.reduce((acc, entry) => {
          const key = entry.type || "other";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
      )
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const financeCategoryDistribution = Object.entries(
        finance
          .filter((entry) => entry.type === "expense")
          .reduce((acc, entry) => {
            const key = entry.category || "Other";
            acc[key] =
              (acc[key] || 0) +
              convertFromBDT(toBDT(entry), selectedCurrency, rates);
            return acc;
          }, {}),
      )
        .map(([name, value]) => ({ name, value: round(value, 2) }))
        .sort((a, b) => b.value - a.value);

      const strongestWeakestHabits = activeHabits.map((habit) => {
        const completed = habitLogs.filter(
          (log) => log.completed && String(log.habitId) === String(habit._id),
        ).length;
        const completion = window.days
          ? round((completed / window.days) * 100)
          : 0;
        return { name: habit.name, completion };
      });

      res.json({
        success: true,
        data: {
          range: window.range,
          currency: selectedCurrency,
          time: {
            productivity30d: dailyTime.map((entry) => ({
              date: entry.date,
              hours: round(entry.value),
            })),
            distribution: [
              { name: "Study", value: round(timeDistributionRaw.study / 3600) },
              { name: "Work", value: round(timeDistributionRaw.work / 3600) },
              {
                name: "Exercise",
                value: round(timeDistributionRaw.exercise / 3600),
              },
              { name: "Sleep", value: round(timeDistributionRaw.sleep / 3600) },
              { name: "Other", value: round(timeDistributionRaw.other / 3600) },
            ],
          },
          study: {
            weeklyBars: dailyStudy.slice(-7).map((entry) => ({
              date: entry.date,
              hours: round(entry.value),
            })),
            subjectDistribution,
            monthlyLine: dailyStudy.map((entry) => ({
              date: entry.date,
              hours: round(entry.value),
            })),
          },
          islamic: {
            prayerConsistency: dailySalah.map((entry) => ({
              date: entry.date,
              percentage: round(entry.value),
            })),
            quranPages: dailyQuran.map((entry) => ({
              date: entry.date,
              pages: round(entry.value, 0),
            })),
            timeline: dailySalah.map((entry, index) => ({
              date: entry.date,
              prayers: round((entry.value / 100) * 5, 1),
              quranPages: round(dailyQuran[index].value, 0),
            })),
          },
          journal: {
            moodTrend: dailyJournalMood.map((entry) => ({
              date: entry.date,
              moodScore: round(entry.value),
            })),
          },
          calories: {
            consumedVsBurned: dailyConsumed.map((entry, index) => ({
              date: entry.date,
              consumed: round(entry.value, 0),
              burned: round(dailyBurned[index].value, 0),
              balance: round(entry.value - dailyBurned[index].value, 0),
            })),
            weeklyBalance: dailyConsumed.slice(-7).map((entry, index) => ({
              date: entry.date,
              balance: round(
                entry.value - dailyBurned.slice(-7)[index].value,
                0,
              ),
            })),
            weightProgress: fitness
              .filter((entry) => Number(entry.weight || 0) > 0)
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((entry) => ({
                date: formatDateKey(entry.date),
                weight: Number(entry.weight),
              })),
          },
          fitness: {
            workoutFrequency: dailyWorkouts.map((entry) => ({
              date: entry.date,
              workouts: round(entry.value, 0),
            })),
            caloriesTrend: dailyBurned.map((entry) => ({
              date: entry.date,
              calories: round(entry.value, 0),
            })),
            categoryDistribution: workoutCategoryDistribution,
          },
          habits: {
            heatmap: dailyHabit.map((entry) => ({
              date: entry.date,
              completion: round(entry.value),
            })),
            streaks: strongestWeakestHabits,
            individualProgress: strongestWeakestHabits,
          },
          finance: {
            incomeVsExpense: dailyIncome.map((entry, index) => ({
              date: entry.date,
              income: round(entry.value, 2),
              expense: round(dailyExpense[index].value, 2),
            })),
            monthlySpending: dailyExpense.map((entry) => ({
              date: entry.date,
              expense: round(entry.value, 2),
            })),
            categorySpending: financeCategoryDistribution,
            savingsGrowth: dailyIncome.map((entry, index, arr) => {
              const cumulativeIncome = arr
                .slice(0, index + 1)
                .reduce((sum, item) => sum + item.value, 0);
              const cumulativeExpense = dailyExpense
                .slice(0, index + 1)
                .reduce((sum, item) => sum + item.value, 0);
              return {
                date: entry.date,
                savings: round(cumulativeIncome - cumulativeExpense, 2),
              };
            }),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to build dashboard charts",
        error: error.message,
      });
    }
  },
};

module.exports = dashboardController;
