const mongoose = require("mongoose");
const FinanceTracker = require("../models/FinanceTracker");
const { validateFinancePayload } = require("../utils/validation");
const {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSFER_CATEGORIES,
  SUPPORTED_CURRENCIES,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
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

const normalizeName = (value = "") =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const resolveTransactionType = (payload = {}) => {
  const candidate = payload.transactionType || payload.type || "expense";
  return TRANSACTION_TYPES.includes(candidate) ? candidate : "expense";
};

const getSuggestionField = (transactionType) => {
  if (transactionType === "income") {
    return "incomeSource";
  }
  if (transactionType === "transfer") {
    return "transactionName";
  }
  return "expenseName";
};

const getNameFromPayload = (transactionType, payload = {}) => {
  if (transactionType === "income") {
    return (
      payload.incomeSource ||
      payload.source ||
      payload.transactionName ||
      payload.description ||
      ""
    ).trim();
  }

  if (transactionType === "transfer") {
    return (payload.transactionName || payload.description || "").trim();
  }

  return (
    payload.expenseName ||
    payload.transactionName ||
    payload.description ||
    ""
  ).trim();
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

const scoreSuggestion = (query, item) => {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) {
    return 0;
  }

  const target = normalizeName(item.name);
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

const toTransactionDTO = (item) => {
  const transactionType = item.transactionType || item.type || "expense";
  const name =
    item.transactionName ||
    item.expenseName ||
    item.incomeSource ||
    item.source ||
    item.description ||
    "Transaction";

  return {
    ...item,
    type: transactionType,
    transactionType,
    transactionName: name,
    expenseName:
      item.expenseName || (transactionType === "expense" ? name : ""),
    incomeSource:
      item.incomeSource ||
      (transactionType === "income" ? name : item.source || ""),
    convertedAmountBDT: toBDT(item),
    signedAmountBDT:
      transactionType === "income"
        ? toBDT(item)
        : transactionType === "expense"
          ? -toBDT(item)
          : 0,
  };
};

const getCashFlowLabel = (dateValue, range) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  if (range === "thisYear") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return date.toISOString().slice(0, 10);
};

const buildAnalytics = (
  transactions,
  range,
  start,
  end,
  previousMonthTotals,
) => {
  const typed = transactions.map(toTransactionDTO);

  const totals = typed.reduce(
    (acc, tx) => {
      if (tx.transactionType === "income") {
        acc.income += tx.convertedAmountBDT;
      } else if (tx.transactionType === "expense") {
        acc.expense += tx.convertedAmountBDT;
      } else {
        acc.transfer += tx.convertedAmountBDT;
      }
      return acc;
    },
    { income: 0, expense: 0, transfer: 0 },
  );

  const balance = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? (balance / totals.income) * 100 : 0;

  const daysInRange = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  const expenseCategoryTotals = typed
    .filter((tx) => tx.transactionType === "expense")
    .reduce((acc, tx) => {
      const key = tx.category || "Other";
      acc[key] = (acc[key] || 0) + tx.convertedAmountBDT;
      return acc;
    }, {});

  const expenseDistribution = Object.entries(expenseCategoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const incomeSourceTotals = typed
    .filter((tx) => tx.transactionType === "income")
    .reduce((acc, tx) => {
      const key = tx.incomeSource || tx.category || "Other";
      acc[key] = (acc[key] || 0) + tx.convertedAmountBDT;
      return acc;
    }, {});

  const incomeSources = Object.entries(incomeSourceTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const currencyTotals = typed.reduce((acc, tx) => {
    const key = tx.currency || "BDT";
    acc[key] = (acc[key] || 0) + tx.convertedAmountBDT;
    return acc;
  }, {});

  const currencyUsage = Object.entries(currencyTotals)
    .map(([currency, value]) => ({ currency, value }))
    .sort((a, b) => b.value - a.value);

  const flowMap = typed.reduce((acc, tx) => {
    const label = getCashFlowLabel(tx.date, range);
    if (!acc[label]) {
      acc[label] = {
        label,
        income: 0,
        expense: 0,
        transfer: 0,
      };
    }

    if (tx.transactionType === "income") {
      acc[label].income += tx.convertedAmountBDT;
    } else if (tx.transactionType === "expense") {
      acc[label].expense += tx.convertedAmountBDT;
    } else {
      acc[label].transfer += tx.convertedAmountBDT;
    }

    return acc;
  }, {});

  const cashFlow = Object.values(flowMap)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((entry) => ({
      ...entry,
      net: entry.income - entry.expense,
    }));

  let runningBalance = 0;
  const balanceTrend = cashFlow.map((entry) => {
    const openingBalance = runningBalance;
    runningBalance = runningBalance + entry.income - entry.expense;
    return {
      label: entry.label,
      openingBalance,
      closingBalance: runningBalance,
      income: entry.income,
      expense: entry.expense,
    };
  });

  const previousExpense = previousMonthTotals?.expense || 0;
  const expenseChangePercentage =
    previousExpense > 0
      ? ((totals.expense - previousExpense) / previousExpense) * 100
      : totals.expense > 0
        ? 100
        : 0;

  return {
    summary: {
      totalBalanceBDT: balance,
      totalIncomeBDT: totals.income,
      totalExpenseBDT: totals.expense,
      totalTransferBDT: totals.transfer,
      savingsRate,
      averageDailyExpenseBDT: totals.expense / daysInRange,
      largestExpenseCategory: expenseDistribution[0]?.name || "N/A",
      expenseChangePercentage,
      previousMonthExpenseBDT: previousExpense,
      previousMonthIncomeBDT: previousMonthTotals?.income || 0,
    },
    charts: {
      expenseDistribution,
      incomeSources,
      categoryComparison: expenseDistribution.slice(0, 10),
      currencyUsage,
      cashFlow,
      balanceTrend,
    },
    recentTransactions: typed
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12),
  };
};

const financeTrackerController = {
  create: async (req, res) => {
    try {
      const transactionType = resolveTransactionType(req.body);
      const {
        amount,
        currency = "BDT",
        exchangeRate,
        category,
        subCategory,
        expenseName,
        incomeSource,
        transactionName,
        description,
        paymentMethod,
        source,
        date,
      } = req.body;

      const payload = {
        transactionType,
        type: transactionType,
        amount,
        currency,
        exchangeRate,
        category,
        subCategory,
        expenseName,
        incomeSource,
        transactionName,
        description,
        paymentMethod,
        date,
      };

      const validation = validateFinancePayload(payload);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      if (
        transactionType === "expense" &&
        subCategory &&
        !isValidSubCategory(category, subCategory, transactionType)
      ) {
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

      const rawName = getNameFromPayload(transactionType, {
        expenseName,
        incomeSource,
        transactionName,
        description,
        source,
      });
      const suggestionField = getSuggestionField(transactionType);
      let canonicalName = rawName;

      if (rawName) {
        const existing = await FinanceTracker.findOne({
          userId: req.userId,
          transactionType,
          $expr: {
            $eq: [{ $toLower: `$${suggestionField}` }, normalizeName(rawName)],
          },
        })
          .sort({ date: -1 })
          .lean();

        if (existing?.[suggestionField]) {
          canonicalName = existing[suggestionField];
        }
      }

      const tracker = new FinanceTracker({
        userId: req.userId,
        transactionType,
        type: transactionType,
        amount,
        currency,
        exchangeRate: resolvedRate,
        convertedAmountBDT: Number(amount) * Number(resolvedRate),
        category,
        subCategory: transactionType === "expense" ? subCategory : "",
        transactionName: canonicalName,
        expenseName: transactionType === "expense" ? canonicalName : "",
        incomeSource:
          transactionType === "income" ? canonicalName : incomeSource || "",
        description,
        paymentMethod,
        source: transactionType === "income" ? canonicalName : source,
        date: safeDate,
      });

      await tracker.save();

      res.status(201).json({
        success: true,
        data: toTransactionDTO(tracker.toObject()),
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
      const { range, startDate, endDate, type, transactionType } = req.query;
      const filter = { userId: req.userId };
      const selectedType =
        transactionType && TRANSACTION_TYPES.includes(transactionType)
          ? transactionType
          : type && TRANSACTION_TYPES.includes(type)
            ? type
            : null;

      if (selectedType && selectedType !== "all") {
        filter.transactionType = selectedType;
      }

      if (range || startDate || endDate) {
        const { start, end } = getDateRange({ range, startDate, endDate });
        filter.date = { $gte: start, $lte: end };
      }

      const trackers = await FinanceTracker.find(filter)
        .sort({ date: -1 })
        .lean();
      res.json({ success: true, data: trackers.map(toTransactionDTO) });
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

      const merged = {
        ...tracker.toObject(),
        ...req.body,
      };

      const transactionType = resolveTransactionType(merged);
      merged.transactionType = transactionType;
      merged.type = transactionType;

      const validation = validateFinancePayload(merged);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const safeDate = normalizeDate(merged.date, tracker.date || new Date());
      const selectedCurrency = merged.currency || "BDT";

      let resolvedRate = Number(merged.exchangeRate);
      if (!resolvedRate || Number.isNaN(resolvedRate) || resolvedRate <= 0) {
        const rateMeta = await getRateToBDT(selectedCurrency, safeDate);
        resolvedRate = rateMeta.rateToBDT;
      }

      const canonicalName = getNameFromPayload(transactionType, merged);

      tracker.transactionType = transactionType;
      tracker.type = transactionType;
      tracker.amount = Number(merged.amount);
      tracker.currency = selectedCurrency;
      tracker.exchangeRate = resolvedRate;
      tracker.convertedAmountBDT = Number(merged.amount) * Number(resolvedRate);
      tracker.category = merged.category || "";
      tracker.subCategory =
        transactionType === "expense" ? merged.subCategory || "" : "";
      tracker.transactionName = canonicalName;
      tracker.expenseName = transactionType === "expense" ? canonicalName : "";
      tracker.incomeSource = transactionType === "income" ? canonicalName : "";
      tracker.description = merged.description || "";
      tracker.paymentMethod = merged.paymentMethod || undefined;
      tracker.source =
        transactionType === "income" ? canonicalName : merged.source || "";
      tracker.date = safeDate;

      await tracker.save();
      res.json({ success: true, data: toTransactionDTO(tracker.toObject()) });
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
        categories: EXPENSE_CATEGORIES,
        expenseCategories: EXPENSE_CATEGORIES,
        incomeCategories: INCOME_CATEGORIES,
        transferCategories: TRANSFER_CATEGORIES,
        transactionTypes: TRANSACTION_TYPES,
        currencies: SUPPORTED_CURRENCIES,
        paymentMethods: PAYMENT_METHODS,
      },
    });
  },

  getSuggestions: async (req, res) => {
    try {
      const query = String(req.query.q || "").trim();
      const limit = Math.min(Number(req.query.limit || 8), 20);
      const transactionType = resolveTransactionType(req.query);
      const field = getSuggestionField(transactionType);
      const userObjectId = new mongoose.Types.ObjectId(req.userId);

      const aggregate = await FinanceTracker.aggregate([
        {
          $match: {
            userId: userObjectId,
            transactionType,
            [field]: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: { $toLower: `$${field}` },
            name: { $last: `$${field}` },
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
          name: item.name,
          expenseName: transactionType === "expense" ? item.name : "",
          incomeSource: transactionType === "income" ? item.name : "",
          transactionName: item.name,
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
      res.status(500).json({
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

      const transactions = await FinanceTracker.find({
        userId: req.userId,
        date: { $gte: start, $lte: end },
      })
        .sort({ date: 1 })
        .lean();

      const previousMonth = getPreviousMonthRange();
      const previousTransactions = await FinanceTracker.find({
        userId: req.userId,
        date: { $gte: previousMonth.start, $lte: previousMonth.end },
      }).lean();

      const previousMonthTotals = previousTransactions.reduce(
        (acc, item) => {
          const tx = toTransactionDTO(item);
          if (tx.transactionType === "income") {
            acc.income += tx.convertedAmountBDT;
          }
          if (tx.transactionType === "expense") {
            acc.expense += tx.convertedAmountBDT;
          }
          return acc;
        },
        { income: 0, expense: 0 },
      );

      const analytics = buildAnalytics(
        transactions,
        range,
        start,
        end,
        previousMonthTotals,
      );

      res.json({
        success: true,
        data: {
          range,
          startDate: start,
          endDate: end,
          ...analytics,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
        error: error.message,
      });
    }
  },

  getIncomeSummary: async (req, res) => {
    try {
      const { range = "thisMonth", startDate, endDate } = req.query;
      const { start, end } = getDateRange({ range, startDate, endDate });

      const incomes = await FinanceTracker.find({
        userId: req.userId,
        transactionType: "income",
        date: { $gte: start, $lte: end },
      }).lean();

      const totalIncomeBDT = incomes.reduce(
        (sum, item) => sum + toBDT(item),
        0,
      );

      const sources = incomes.reduce((acc, item) => {
        const key =
          item.incomeSource || item.source || item.category || "Other";
        acc[key] = (acc[key] || 0) + toBDT(item);
        return acc;
      }, {});

      const bySource = Object.entries(sources)
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalIncomeBDT > 0 ? (value / totalIncomeBDT) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      res.json({
        success: true,
        data: {
          totalIncomeBDT,
          bySource,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch income summary",
        error: error.message,
      });
    }
  },

  getBalance: async (req, res) => {
    try {
      const records = await FinanceTracker.find({ userId: req.userId }).lean();

      const totals = records.reduce(
        (acc, item) => {
          const tx = toTransactionDTO(item);
          if (tx.transactionType === "income") {
            acc.income += tx.convertedAmountBDT;
          } else if (tx.transactionType === "expense") {
            acc.expense += tx.convertedAmountBDT;
          }
          return acc;
        },
        { income: 0, expense: 0 },
      );

      res.json({
        success: true,
        data: {
          totalIncomeBDT: totals.income,
          totalExpenseBDT: totals.expense,
          totalBalanceBDT: totals.income - totals.expense,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch balance",
        error: error.message,
      });
    }
  },

  getCashFlow: async (req, res) => {
    try {
      const { range = "thisMonth", startDate, endDate } = req.query;
      const { start, end } = getDateRange({ range, startDate, endDate });

      const records = await FinanceTracker.find({
        userId: req.userId,
        date: { $gte: start, $lte: end },
      }).lean();

      const flowMap = records.reduce((acc, item) => {
        const tx = toTransactionDTO(item);
        const label = getCashFlowLabel(tx.date, range);

        if (!acc[label]) {
          acc[label] = { label, income: 0, expense: 0, transfer: 0 };
        }

        if (tx.transactionType === "income") {
          acc[label].income += tx.convertedAmountBDT;
        } else if (tx.transactionType === "expense") {
          acc[label].expense += tx.convertedAmountBDT;
        } else {
          acc[label].transfer += tx.convertedAmountBDT;
        }

        return acc;
      }, {});

      const cashFlow = Object.values(flowMap)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((item) => ({
          ...item,
          net: item.income - item.expense,
        }));

      res.json({ success: true, data: cashFlow });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch cash flow",
        error: error.message,
      });
    }
  },

  migrateLegacyRecords: async (req, res) => {
    try {
      const legacyRecords = await FinanceTracker.find({
        userId: req.userId,
        $or: [
          { transactionType: { $exists: false } },
          { currency: { $exists: false } },
          { exchangeRate: { $exists: false } },
          { convertedAmountBDT: { $exists: false } },
          { transactionName: { $exists: false } },
        ],
      });

      let updatedCount = 0;

      for (const record of legacyRecords) {
        const transactionType = resolveTransactionType(record);

        if (!record.transactionType) {
          record.transactionType = transactionType;
        }

        if (!record.type) {
          record.type = transactionType;
        }

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

        if (!record.transactionName) {
          record.transactionName =
            record.expenseName ||
            record.incomeSource ||
            record.source ||
            record.description ||
            "Transaction";
        }

        if (record.transactionType === "expense" && !record.expenseName) {
          record.expenseName = record.transactionName;
        }

        if (record.transactionType === "income" && !record.incomeSource) {
          record.incomeSource = record.source || record.transactionName;
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
      res.status(500).json({
        success: false,
        message: "Migration failed",
        error: error.message,
      });
    }
  },
};

module.exports = financeTrackerController;
