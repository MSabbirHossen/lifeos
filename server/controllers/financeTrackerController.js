const mongoose = require("mongoose");
const FinanceTracker = require("../models/FinanceTracker");
const { validateFinancePayload } = require("../utils/validation");
const {
  FINANCE_CATEGORIES,
  SUPPORTED_CURRENCIES,
  isValidSubCategory,
} = require("../constants/financeCategories");
const {
  getRateToBDT,
  getRatesForDate,
} = require("../services/currencyService");

const normalizeDate = (value, fallback = new Date()) => {
  const parsed = value ? new Date(value) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const getDateRange = ({ range = "thisMonth", startDate, endDate }) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "today") {
    return { start, end };
  }

  if (range === "thisWeek") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return { start, end };
  }

  if (range === "thisYear") {
    start.setMonth(0, 1);
    return { start, end };
  }

  if (range === "custom") {
    const customStart = normalizeDate(startDate, start);
    customStart.setHours(0, 0, 0, 0);

    const customEnd = normalizeDate(endDate, end);
    customEnd.setHours(23, 59, 59, 999);

    return { start: customStart, end: customEnd };
  }

  start.setDate(1);
  return { start, end };
};

const getPreviousMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const normalizeName = (value = "") =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const scoreSuggestion = (query, item) => {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) {
    return 0;
  }

  const target = normalizeName(item.expenseName);
  if (!target) {
    return 0;
  }

  let score = 0;

  if (target.startsWith(normalizedQuery)) {
    score += 100;
  } else if (target.includes(normalizedQuery)) {
    score += 70;
  }

  const queryChars = normalizedQuery.split("");
  let pointer = 0;
  for (
    let index = 0;
    index < target.length && pointer < queryChars.length;
    index += 1
  ) {
    if (target[index] === queryChars[pointer]) {
      pointer += 1;
    }
  }

  if (pointer === queryChars.length) {
    score += 40;
  }

  score += Math.min(item.count || 0, 40);

  const lastUsedDate = new Date(item.lastUsed || 0);
  if (!Number.isNaN(lastUsedDate.getTime())) {
    const diffDays = Math.max(
      0,
      (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    score += Math.max(0, 30 - Math.floor(diffDays / 3));
  }

  return score;
};

const toBDT = (entry) => {
  if (
    entry?.convertedAmountBDT != null &&
    !Number.isNaN(entry.convertedAmountBDT)
  ) {
    return Number(entry.convertedAmountBDT);
  }

  const baseAmount = Number(entry?.amount || 0);
  const rate = Number(entry?.exchangeRate || 1);
  return baseAmount * rate;
};

const formatRelativeLastUsed = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "unknown";
  }

  const diffDays = Math.floor(
    (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }

  const months = Math.floor(diffDays / 30);
  if (months === 1) {
    return "1 month ago";
  }

  if (months < 12) {
    return `${months} months ago`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
};

const financeTrackerController = {
  create: async (req, res) => {
    try {
      const {
        type,
        amount,
        currency = "BDT",
        exchangeRate,
        category,
        subCategory,
        expenseName,
        description,
        paymentMethod,
        source,
        date,
      } = req.body;

      const validation = validateFinancePayload({
        type,
        amount,
        currency,
        exchangeRate,
        category,
        subCategory,
        expenseName,
        description,
        paymentMethod,
        date,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      if (subCategory && !isValidSubCategory(category, subCategory)) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: ["subCategory is invalid for selected category"],
        });
      }

      const safeDate = normalizeDate(date);
      let resolvedRate = Number(exchangeRate);
      let rateSource = "manual";

      if (!resolvedRate || Number.isNaN(resolvedRate) || resolvedRate <= 0) {
        const rateMeta = await getRateToBDT(currency, safeDate);
        resolvedRate = rateMeta.rateToBDT;
        rateSource = rateMeta.source;
      }

      const normalizedInputName = (expenseName || description || "").trim();
      let canonicalExpenseName = normalizedInputName;

      if (type === "expense" && normalizedInputName) {
        const existing = await FinanceTracker.findOne({
          userId: req.userId,
          type: "expense",
          $expr: {
            $eq: [
              { $toLower: "$expenseName" },
              normalizeName(normalizedInputName),
            ],
          },
        })
          .sort({ date: -1 })
          .lean();

        if (existing?.expenseName) {
          canonicalExpenseName = existing.expenseName;
        }
      }

      const tracker = new FinanceTracker({
        userId: req.userId,
        type,
        amount,
        currency,
        exchangeRate: resolvedRate,
        convertedAmountBDT: Number(amount) * Number(resolvedRate),
        category,
        subCategory,
        expenseName: type === "expense" ? canonicalExpenseName : undefined,
        description,
        paymentMethod,
        source,
        date: safeDate,
      });

      await tracker.save();

      res.status(201).json({
        success: true,
        data: tracker,
        meta: {
          exchangeRateSource: rateSource,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const { range, startDate, endDate, type } = req.query;
      const filter = { userId: req.userId };

      if (type && ["expense", "income"].includes(type)) {
        filter.type = type;
      }

      if (range || startDate || endDate) {
        const { start, end } = getDateRange({ range, startDate, endDate });
        filter.date = { $gte: start, $lte: end };
      }

      const trackers = await FinanceTracker.find(filter).sort({ date: -1 });

      const data = trackers.map((item) => ({
        ...item.toObject(),
        currency: item.currency || "BDT",
        exchangeRate: item.exchangeRate || 1,
        convertedAmountBDT: toBDT(item),
        expenseName: item.expenseName || item.description || "",
      }));

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const tracker = await FinanceTracker.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Finance tracker not found" });
      }

      const payload = {
        ...tracker.toObject(),
        ...req.body,
      };

      const validation = validateFinancePayload(payload);
      if (!validation.isValid) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation failed",
            errors: validation.errors,
          });
      }

      const safeDate = normalizeDate(payload.date, tracker.date || new Date());
      const selectedCurrency = payload.currency || "BDT";

      let resolvedRate = Number(payload.exchangeRate);
      if (!resolvedRate || Number.isNaN(resolvedRate) || resolvedRate <= 0) {
        const rateMeta = await getRateToBDT(selectedCurrency, safeDate);
        resolvedRate = rateMeta.rateToBDT;
      }

      tracker.type = payload.type;
      tracker.amount = Number(payload.amount);
      tracker.currency = selectedCurrency;
      tracker.exchangeRate = resolvedRate;
      tracker.convertedAmountBDT =
        Number(payload.amount) * Number(resolvedRate);
      tracker.category = payload.category || "";
      tracker.subCategory = payload.subCategory || "";
      tracker.expenseName = payload.expenseName || payload.description || "";
      tracker.description = payload.description || "";
      tracker.paymentMethod = payload.paymentMethod || undefined;
      tracker.source = payload.source || "";
      tracker.date = safeDate;

      await tracker.save();

      res.json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  delete: async (req, res) => {
    try {
      const tracker = await FinanceTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Finance tracker not found" });
      }
      res.json({ success: true, message: "Finance tracker deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getCategories: async (req, res) => {
    res.json({
      success: true,
      data: {
        categories: FINANCE_CATEGORIES,
        currencies: SUPPORTED_CURRENCIES,
        paymentMethods: ["Cash", "Card", "Bank", "Mobile Payment"],
      },
    });
  },

  getSuggestions: async (req, res) => {
    try {
      const query = String(req.query.q || "").trim();
      const limit = Math.min(Number(req.query.limit || 8), 20);
      const userObjectId = new mongoose.Types.ObjectId(req.userId);

      const aggregate = await FinanceTracker.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: "expense",
            expenseName: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: { $toLower: "$expenseName" },
            expenseName: { $last: "$expenseName" },
            category: { $last: "$category" },
            subCategory: { $last: "$subCategory" },
            count: { $sum: 1 },
            lastUsed: { $max: "$date" },
          },
        },
      ]);

      const ranked = aggregate
        .map((item) => ({
          ...item,
          score: scoreSuggestion(query, item),
        }))
        .filter((item) => (query ? item.score > 0 : true))
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return new Date(b.lastUsed) - new Date(a.lastUsed);
        })
        .slice(0, limit)
        .map((item) => ({
          expenseName: item.expenseName,
          category: item.category || "Other",
          subCategory: item.subCategory || "",
          count: item.count,
          lastUsed: item.lastUsed,
          lastUsedLabel: formatRelativeLastUsed(item.lastUsed),
        }));

      res.json({ success: true, data: ranked });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getRates: async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date) : new Date();
      const rates = await getRatesForDate(date);

      res.json({
        success: true,
        data: {
          date: date.toISOString().slice(0, 10),
          rates: {
            BDT: 1,
            SAR: Number(rates.SAR),
            USD: Number(rates.USD),
          },
          source: rates.source || "database",
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch rates",
          error: error.message,
        });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const { range = "thisMonth", startDate, endDate } = req.query;
      const { start, end } = getDateRange({ range, startDate, endDate });

      const expenses = await FinanceTracker.find({
        userId: req.userId,
        type: "expense",
        date: { $gte: start, $lte: end },
      })
        .sort({ date: 1 })
        .lean();

      const previousMonth = getPreviousMonthRange();
      const previousExpenses = await FinanceTracker.find({
        userId: req.userId,
        type: "expense",
        date: { $gte: previousMonth.start, $lte: previousMonth.end },
      }).lean();

      const totalBDT = expenses.reduce((sum, item) => sum + toBDT(item), 0);
      const previousTotalBDT = previousExpenses.reduce(
        (sum, item) => sum + toBDT(item),
        0,
      );

      const daysInRange = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1,
      );

      const averageDaily = totalBDT / daysInRange;

      const categoryTotals = expenses.reduce((acc, item) => {
        const key = item.category || "Other";
        acc[key] = (acc[key] || 0) + toBDT(item);
        return acc;
      }, {});

      const categoryDistribution = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const largestCategory = categoryDistribution[0]?.name || "N/A";

      const trendMap = expenses.reduce((acc, item) => {
        const dateObj = new Date(item.date);
        const key =
          range === "thisYear"
            ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`
            : dateObj.toISOString().slice(0, 10);

        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += toBDT(item);
        return acc;
      }, {});

      const trend = Object.entries(trendMap)
        .map(([label, amount]) => ({ label, amount }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const currencyTotals = expenses.reduce((acc, item) => {
        const key = item.currency || "BDT";
        acc[key] = (acc[key] || 0) + toBDT(item);
        return acc;
      }, {});

      const currencyUsage = Object.entries(currencyTotals)
        .map(([currency, value]) => ({ currency, value }))
        .sort((a, b) => b.value - a.value);

      const changePercentage =
        previousTotalBDT > 0
          ? ((totalBDT - previousTotalBDT) / previousTotalBDT) * 100
          : totalBDT > 0
            ? 100
            : 0;

      res.json({
        success: true,
        data: {
          range,
          startDate: start,
          endDate: end,
          summary: {
            totalSpendingBDT: totalBDT,
            previousMonthSpendingBDT: previousTotalBDT,
            changePercentage,
            averageDailySpendingBDT: averageDaily,
            largestCategory,
          },
          charts: {
            distribution: categoryDistribution,
            trend,
            categoryComparison: categoryDistribution.slice(0, 10),
            currencyUsage,
          },
          recentTransactions: expenses
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map((item) => ({
              ...item,
              convertedAmountBDT: toBDT(item),
            })),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch analytics",
          error: error.message,
        });
    }
  },

  migrateLegacyRecords: async (req, res) => {
    try {
      const legacyRecords = await FinanceTracker.find({
        userId: req.userId,
        $or: [
          { currency: { $exists: false } },
          { exchangeRate: { $exists: false } },
          { convertedAmountBDT: { $exists: false } },
          { expenseName: { $exists: false } },
        ],
      });

      let updatedCount = 0;

      for (const record of legacyRecords) {
        if (!record.currency) {
          record.currency = "BDT";
        }

        if (
          !record.exchangeRate ||
          Number.isNaN(record.exchangeRate) ||
          record.exchangeRate <= 0
        ) {
          record.exchangeRate = 1;
        }

        if (
          record.convertedAmountBDT == null ||
          Number.isNaN(record.convertedAmountBDT) ||
          record.convertedAmountBDT <= 0
        ) {
          record.convertedAmountBDT =
            Number(record.amount || 0) * Number(record.exchangeRate || 1);
        }

        if (!record.expenseName && record.type === "expense") {
          record.expenseName = record.description || "Expense";
        }

        await record.save();
        updatedCount += 1;
      }

      res.json({
        success: true,
        data: {
          updatedCount,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Migration failed",
          error: error.message,
        });
    }
  },
};

module.exports = financeTrackerController;
