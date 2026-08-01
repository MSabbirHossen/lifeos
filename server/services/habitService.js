const Habit = require("../models/Habit");
const HabitTemplate = require("../models/HabitTemplate");
const UserHabit = require("../models/UserHabit");
const HabitLog = require("../models/HabitLog");
const defaultHabits = require("../data/defaultHabits");

const normalizeName = (value = "") => value.trim().toLowerCase();

const startOfUtcDay = (value = new Date()) => {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const levenshteinDistance = (a = "", b = "") => {
  const left = a.toLowerCase();
  const right = b.toLowerCase();

  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const matrix = Array.from({ length: right.length + 1 }, (_, index) => [
    index,
  ]);
  for (let i = 0; i <= left.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let r = 1; r <= right.length; r += 1) {
    for (let c = 1; c <= left.length; c += 1) {
      const cost = left[c - 1] === right[r - 1] ? 0 : 1;
      matrix[r][c] = Math.min(
        matrix[r - 1][c] + 1,
        matrix[r][c - 1] + 1,
        matrix[r - 1][c - 1] + cost,
      );
    }
  }

  return matrix[right.length][left.length];
};

const getSimilarity = (a = "", b = "") => {
  if (!a || !b) return 0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
};

const seedDefaultTemplates = async () => {
  for (const entry of defaultHabits) {
    const nameNormalized = normalizeName(entry.name);
    await HabitTemplate.findOneAndUpdate(
      { nameNormalized },
      {
        $setOnInsert: {
          ...entry,
          nameNormalized,
          description: entry.description || "",
        },
        $set: {
          category: entry.category,
          icon: entry.icon,
          frequency: entry.frequency,
          default: true,
        },
      },
      { upsert: true, new: true },
    );
  }
};

const createUserHabitFromTemplate = async (userId, template) => {
  return UserHabit.findOneAndUpdate(
    {
      userId,
      habitTemplateId: template._id,
    },
    {
      $setOnInsert: {
        userId,
        habitTemplateId: template._id,
        name: template.name,
        nameNormalized: template.nameNormalized,
        category: template.category,
        icon: template.icon,
        frequency: template.frequency,
        custom: !template.default,
        active: true,
      },
    },
    { upsert: true, new: true },
  );
};

const migrateLegacyHabitsForUser = async (userId) => {
  const legacyHabits = await Habit.find({ userId });

  for (const legacyHabit of legacyHabits) {
    const normalized = normalizeName(legacyHabit.habitName || "");
    if (!normalized) {
      continue;
    }

    const userHabit = await UserHabit.findOneAndUpdate(
      {
        userId,
        nameNormalized: normalized,
      },
      {
        $setOnInsert: {
          userId,
          name: legacyHabit.habitName,
          nameNormalized: normalized,
          category: legacyHabit.category || "General",
          icon: "✅",
          frequency: "Daily",
          custom: true,
          active: true,
        },
      },
      { upsert: true, new: true },
    );

    if (legacyHabit.status) {
      const day = startOfUtcDay(
        legacyHabit.date || legacyHabit.createdAt || new Date(),
      );
      await HabitLog.findOneAndUpdate(
        { userId, habitId: userHabit._id, date: day },
        {
          $set: {
            completed: true,
            completedAt: legacyHabit.date || new Date(),
          },
          $setOnInsert: {
            userId,
            habitId: userHabit._id,
            date: day,
          },
        },
        { upsert: true, new: true },
      );
    }
  }
};

const initializeDefaultHabitsForUser = async (userId) => {
  await seedDefaultTemplates();
  await migrateLegacyHabitsForUser(userId);

  const defaultTemplates = await HabitTemplate.find({ default: true });
  for (const template of defaultTemplates) {
    await createUserHabitFromTemplate(userId, template);
  }

  return UserHabit.countDocuments({ userId, active: true });
};

const buildHabitView = (habit, todaysLog) => {
  const completedToday = Boolean(todaysLog?.completed);

  return {
    _id: habit._id,
    userId: habit.userId,
    habitTemplateId: habit.habitTemplateId || null,
    name: habit.name,
    habitName: habit.name,
    category: habit.category,
    icon: habit.icon,
    frequency: habit.frequency,
    custom: habit.custom,
    active: habit.active,
    status: completedToday,
    completedToday,
    date: todaysLog?.completedAt || todaysLog?.date || habit.createdAt,
    createdAt: habit.createdAt,
  };
};

const getUserHabitsWithTodayState = async (
  userId,
  { includeInactive = false } = {},
) => {
  const today = startOfUtcDay(new Date());
  const filter = { userId };
  if (!includeInactive) {
    filter.active = true;
  }

  const habits = await UserHabit.find(filter).sort({ createdAt: -1 }).lean();
  const habitIds = habits.map((habit) => habit._id);

  const logs = habitIds.length
    ? await HabitLog.find({
        userId,
        habitId: { $in: habitIds },
        date: today,
      }).lean()
    : [];

  const logsByHabit = new Map(logs.map((log) => [String(log.habitId), log]));

  return habits.map((habit) =>
    buildHabitView(habit, logsByHabit.get(String(habit._id))),
  );
};

const searchHabits = async (userId, query, limit = 10) => {
  const trimmed = (query || "").trim();
  if (!trimmed) return [];

  const normalized = normalizeName(trimmed);
  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [userHabits, templates] = await Promise.all([
    UserHabit.find({ userId, name: regex }).limit(20).lean(),
    HabitTemplate.find({ name: regex }).limit(20).lean(),
  ]);

  let fuzzyUserHabits = [];
  let fuzzyTemplates = [];

  if (userHabits.length + templates.length < limit) {
    [fuzzyUserHabits, fuzzyTemplates] = await Promise.all([
      UserHabit.find({ userId }).limit(200).lean(),
      HabitTemplate.find({}).limit(300).lean(),
    ]);
  }

  const seen = new Set();
  const merged = [];

  const pushCandidate = (item, source, existingUserHabit = false) => {
    const key = normalizeName(item.name);
    if (!key || seen.has(`${source}:${item._id}`)) return;

    const startsWithBoost = key.startsWith(normalized) ? 0.2 : 0;
    const includesBoost = key.includes(normalized) ? 0.15 : 0;
    const similarity = getSimilarity(normalized, key);
    const score = similarity + startsWithBoost + includesBoost;

    merged.push({
      id: item._id,
      source,
      name: item.name,
      category: item.category,
      icon: item.icon,
      frequency: item.frequency,
      habitTemplateId:
        item.habitTemplateId || (source === "template" ? item._id : null),
      existingUserHabit,
      score,
    });

    seen.add(`${source}:${item._id}`);
  };

  userHabits.forEach((habit) => pushCandidate(habit, "user", true));
  templates.forEach((template) => {
    const matchingUserHabit = userHabits.find(
      (habit) => normalizeName(habit.name) === normalizeName(template.name),
    );
    pushCandidate(template, "template", Boolean(matchingUserHabit));
  });

  if (fuzzyUserHabits.length || fuzzyTemplates.length) {
    fuzzyUserHabits
      .filter(
        (habit) => getSimilarity(normalized, normalizeName(habit.name)) >= 0.5,
      )
      .forEach((habit) => pushCandidate(habit, "user", true));

    fuzzyTemplates
      .filter(
        (template) =>
          getSimilarity(normalized, normalizeName(template.name)) >= 0.5,
      )
      .forEach((template) => {
        const matchingUserHabit = fuzzyUserHabits.find(
          (habit) => normalizeName(habit.name) === normalizeName(template.name),
        );
        pushCandidate(template, "template", Boolean(matchingUserHabit));
      });
  }

  merged.sort((left, right) => right.score - left.score);

  return merged.slice(0, limit);
};

const upsertHabitLog = async ({
  userId,
  habitId,
  completed,
  notes,
  date = new Date(),
}) => {
  const day = startOfUtcDay(date);
  const completedAt = completed ? new Date() : null;

  return HabitLog.findOneAndUpdate(
    { userId, habitId, date: day },
    {
      $set: {
        completed,
        completedAt,
        notes: notes || "",
      },
      $setOnInsert: {
        userId,
        habitId,
        date: day,
      },
    },
    { upsert: true, new: true },
  );
};

const getHabitStats = async (userId) => {
  const habits = await UserHabit.find({ userId, active: true }).lean();
  const habitIds = habits.map((habit) => habit._id);

  if (!habitIds.length) {
    return {
      today: { completed: 0, total: 0, percentage: 0 },
      streak: { current: 0, best: 0 },
      categories: [],
      weeklyProgress: [],
      monthlyProgress: [],
      habits: [],
    };
  }

  const today = startOfUtcDay(new Date());
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - 6);

  const [todayLogs, monthLogs, allCompletedLogs] = await Promise.all([
    HabitLog.find({
      userId,
      habitId: { $in: habitIds },
      date: today,
      completed: true,
    }).lean(),
    HabitLog.find({
      userId,
      habitId: { $in: habitIds },
      date: { $gte: monthStart },
      completed: true,
    }).lean(),
    HabitLog.find({ userId, habitId: { $in: habitIds }, completed: true })
      .sort({ date: 1 })
      .lean(),
  ]);

  const todayCompleted = todayLogs.length;
  const totalHabits = habits.length;
  const todayPercentage = totalHabits
    ? Math.round((todayCompleted / totalHabits) * 100)
    : 0;

  const completionByDay = new Map();
  monthLogs.forEach((log) => {
    const key = log.date.toISOString().slice(0, 10);
    completionByDay.set(key, (completionByDay.get(key) || 0) + 1);
  });

  const weeklyProgress = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + offset);
    const key = date.toISOString().slice(0, 10);
    const completed = completionByDay.get(key) || 0;
    weeklyProgress.push({
      date: key,
      completed,
      total: totalHabits,
      percentage: totalHabits ? Math.round((completed / totalHabits) * 100) : 0,
    });
  }

  const monthlyProgress = [];
  const monthDays = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
  ).getUTCDate();
  for (let day = 1; day <= monthDays; day += 1) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), day),
    );
    const key = date.toISOString().slice(0, 10);
    monthlyProgress.push({
      date: key,
      completed: completionByDay.get(key) || 0,
      total: totalHabits,
    });
  }

  const categoryBucket = new Map();
  habits.forEach((habit) => {
    const key = habit.category || "General";
    if (!categoryBucket.has(key)) {
      categoryBucket.set(key, { category: key, total: 0, completed: 0 });
    }
    categoryBucket.get(key).total += 1;
  });

  todayLogs.forEach((log) => {
    const habit = habits.find(
      (item) => String(item._id) === String(log.habitId),
    );
    const category = habit?.category || "General";
    const bucket = categoryBucket.get(category);
    if (bucket) {
      bucket.completed += 1;
    }
  });

  const categories = Array.from(categoryBucket.values()).map((entry) => ({
    ...entry,
    percentage: entry.total
      ? Math.round((entry.completed / entry.total) * 100)
      : 0,
  }));

  const streaksByHabit = new Map();
  allCompletedLogs.forEach((log) => {
    const id = String(log.habitId);
    if (!streaksByHabit.has(id)) {
      streaksByHabit.set(id, []);
    }
    streaksByHabit.get(id).push(log.date.toISOString().slice(0, 10));
  });

  let bestStreak = 0;
  let currentStreak = 0;

  const habitStats = habits.map((habit) => {
    const dates = Array.from(
      new Set(streaksByHabit.get(String(habit._id)) || []),
    ).sort();

    let best = 0;
    let current = 0;
    let running = 0;
    let previousDate = null;

    dates.forEach((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      if (!previousDate) {
        running = 1;
      } else {
        const diffDays = Math.round(
          (date - previousDate) / (1000 * 60 * 60 * 24),
        );
        running = diffDays === 1 ? running + 1 : 1;
      }
      best = Math.max(best, running);
      previousDate = date;
    });

    let pointer = today;
    const dateSet = new Set(dates);
    while (dateSet.has(pointer.toISOString().slice(0, 10))) {
      current += 1;
      pointer = new Date(pointer);
      pointer.setUTCDate(pointer.getUTCDate() - 1);
    }

    bestStreak = Math.max(bestStreak, best);
    currentStreak = Math.max(currentStreak, current);

    const completionRate = monthlyProgress.length
      ? Math.round(
          (dates.filter((value) =>
            value.startsWith(today.toISOString().slice(0, 7)),
          ).length /
            monthlyProgress.length) *
            100,
        )
      : 0;

    return {
      habitId: habit._id,
      name: habit.name,
      icon: habit.icon,
      category: habit.category,
      currentStreak: current,
      bestStreak: best,
      monthlyCompletionPercentage: completionRate,
    };
  });

  return {
    today: {
      completed: todayCompleted,
      total: totalHabits,
      percentage: todayPercentage,
    },
    streak: {
      current: currentStreak,
      best: bestStreak,
    },
    categories,
    weeklyProgress,
    monthlyProgress,
    habits: habitStats,
  };
};

module.exports = {
  normalizeName,
  startOfUtcDay,
  seedDefaultTemplates,
  initializeDefaultHabitsForUser,
  getUserHabitsWithTodayState,
  searchHabits,
  upsertHabitLog,
  getHabitStats,
};
