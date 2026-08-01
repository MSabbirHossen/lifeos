import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Coins,
  CreditCard,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/Card";
import API from "../../utils/api";
import {
  DEFAULT_CURRENCIES,
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
} from "../../data/financeCategories";

const CHART_COLORS = [
  "#06b6d4",
  "#f97316",
  "#22c55e",
  "#ef4444",
  "#eab308",
  "#3b82f6",
  "#14b8a6",
  "#a855f7",
];

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Year", value: "thisYear" },
  { label: "Custom Range", value: "custom" },
];

const defaultForm = {
  amount: "",
  currency: "BDT",
  category: "Food",
  subCategory: "Breakfast",
  expenseName: "",
  description: "",
  paymentMethod: "Cash",
  date: new Date().toISOString().slice(0, 10),
};

const formatBDT = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatOriginal = (amount, currency) => {
  if (!amount) {
    return "-";
  }
  return `${Number(amount).toFixed(2)} ${currency || "BDT"}`;
};

const Finance = () => {
  const [categories, setCategories] = useState(DEFAULT_FINANCE_CATEGORIES);
  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [formData, setFormData] = useState(defaultForm);
  const [rates, setRates] = useState({ BDT: 1, SAR: 32, USD: 120 });
  const [range, setRange] = useState("thisMonth");
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, item) => {
      acc[item.category] = item.subCategories;
      return acc;
    }, {});
  }, [categories]);

  const availableSubCategories = categoryMap[formData.category] || [];

  useEffect(() => {
    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    if (range === "custom" && customRange.startDate && customRange.endDate) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customRange.startDate, customRange.endDate]);

  useEffect(() => {
    const selectedList = categoryMap[formData.category] || [];
    if (!selectedList.length) {
      if (formData.subCategory) {
        setFormData((prev) => ({ ...prev, subCategory: "" }));
      }
      return;
    }

    if (!selectedList.includes(formData.subCategory)) {
      setFormData((prev) => ({ ...prev, subCategory: selectedList[0] }));
    }
  }, [categoryMap, formData.category, formData.subCategory]);

  const initializePage = async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, rateResponse] = await Promise.all([
        API.get("/finance/categories").catch(() => null),
        API.get("/finance/rates").catch(() => null),
      ]);

      if (categoryResponse?.data?.data?.categories?.length) {
        setCategories(categoryResponse.data.data.categories);
      }

      if (categoryResponse?.data?.data?.currencies?.length) {
        setCurrencies(categoryResponse.data.data.currencies);
      }

      if (categoryResponse?.data?.data?.paymentMethods?.length) {
        setPaymentMethods(categoryResponse.data.data.paymentMethods);
      }

      if (rateResponse?.data?.data?.rates) {
        setRates(rateResponse.data.data.rates);
      }

      await refreshData();
    } catch (apiError) {
      setError("Unable to load finance dashboard right now.");
    } finally {
      setLoading(false);
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("range", range);

    if (range === "custom") {
      if (customRange.startDate) {
        params.set("startDate", customRange.startDate);
      }
      if (customRange.endDate) {
        params.set("endDate", customRange.endDate);
      }
    }

    return params.toString();
  };

  const refreshData = async () => {
    if (
      range === "custom" &&
      (!customRange.startDate || !customRange.endDate)
    ) {
      return;
    }

    try {
      const query = buildQuery();
      const [analyticsResponse, transactionResponse] = await Promise.all([
        API.get(`/finance/analytics?${query}`),
        API.get(`/finance?${query}&type=expense`),
      ]);

      setAnalytics(analyticsResponse.data.data);
      setTransactions(transactionResponse.data.data || []);
    } catch (apiError) {
      setError("Failed to refresh finance analytics.");
    }
  };

  const handleNameChange = async (value) => {
    setFormData((prev) => ({ ...prev, expenseName: value }));

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data } = await API.get(
        `/finance/suggestions?q=${encodeURIComponent(value)}&limit=6`,
      );
      setSuggestions(data.data || []);
      setShowSuggestions(true);
    } catch (apiError) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      expenseName: item.expenseName,
      category: item.category || prev.category,
      subCategory: item.subCategory || prev.subCategory,
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    const amount = Number(formData.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setError("Please provide a valid expense amount.");
      return;
    }

    if (!formData.expenseName.trim()) {
      setError("Expense name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await API.post("/finance", {
        type: "expense",
        amount,
        currency: formData.currency,
        category: formData.category,
        subCategory: formData.subCategory,
        expenseName: formData.expenseName.trim(),
        description: formData.description.trim(),
        paymentMethod: formData.paymentMethod,
        date: formData.date,
      });

      setFormData((prev) => ({
        ...defaultForm,
        category: prev.category,
        subCategory: prev.subCategory,
      }));

      setShowSuggestions(false);
      await refreshData();
    } catch (apiError) {
      const responseMessage =
        apiError?.response?.data?.errors?.[0] ||
        apiError?.response?.data?.message ||
        "Failed to add expense.";
      setError(responseMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/finance/${id}`);
      await refreshData();
    } catch (apiError) {
      setError("Failed to delete expense.");
    }
  };

  const summary = analytics?.summary || {};
  const charts = analytics?.charts || {};

  const convertedPreview = useMemo(() => {
    const amount = Number(formData.amount);
    const rate = Number(rates?.[formData.currency] || 1);
    if (!amount || Number.isNaN(amount)) {
      return 0;
    }
    return amount * rate;
  }, [formData.amount, formData.currency, rates]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-slate-100 via-cyan-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 min-h-screen">
      <div className="rounded-2xl p-5 md:p-6 border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-800/70 backdrop-blur-md shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
              Personal Finance Intelligence
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Smart Expense Tracker
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
            <Sparkles size={16} />
            <span className="text-sm font-medium">
              All insights centralized in BDT
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Quick Add Expense
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: event.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {categories.map((item) => (
                  <option key={item.category} value={item.category}>
                    {item.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Sub Category
              </label>
              <select
                value={formData.subCategory}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    subCategory: event.target.value,
                  }))
                }
                disabled={!availableSubCategories.length}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-50"
              >
                {!availableSubCategories.length && (
                  <option value="">N/A</option>
                )}
                {availableSubCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Expense Name
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={formData.expenseName}
                  onChange={(event) => handleNameChange(event.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  className="w-full pl-9 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="Type to search previous expenses"
                />
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-64 overflow-y-auto">
                  {suggestions.map((item) => (
                    <button
                      type="button"
                      key={`${item.expenseName}-${item.lastUsed}`}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => handleSuggestionSelect(item)}
                    >
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.expenseName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Used {item.count} times • Last {item.lastUsedLabel}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Description (optional)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="Add notes"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, date: event.target.value }))
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Conversion preview
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {formatOriginal(formData.amount || 0, formData.currency)} ≈{" "}
                {formatBDT(convertedPreview)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:opacity-60"
            >
              <Plus size={18} />
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </div>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Total Spending
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatBDT(summary.totalSpendingBDT)}
              </p>
              <div className="mt-2 text-xs inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Wallet size={14} />
                BDT centralized
              </div>
            </Card>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Compared Previous Month
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  Number(summary.changePercentage || 0) >= 0
                    ? "text-rose-500"
                    : "text-emerald-500"
                }`}
              >
                {Number(summary.changePercentage || 0) >= 0 ? (
                  <ArrowUp className="inline mr-1" size={18} />
                ) : (
                  <ArrowDown className="inline mr-1" size={18} />
                )}
                {Math.abs(Number(summary.changePercentage || 0)).toFixed(1)}%
              </p>
            </Card>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Average Daily
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatBDT(summary.averageDailySpendingBDT)}
              </p>
              <div className="mt-2 text-xs inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <CalendarDays size={14} />
                Range average
              </div>
            </Card>
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Largest Category
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.largestCategory || "N/A"}
              </p>
              <div className="mt-2 text-xs inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Coins size={14} />
                Highest BDT share
              </div>
            </Card>
          </div>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
            <div className="flex flex-wrap gap-2">
              {DATE_FILTERS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setRange(item.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    range === item.value
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {range === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(event) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(event) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Expense Distribution
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.distribution || []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {(charts.distribution || []).map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatBDT(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Currency Usage
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.currencyUsage || []}>
                    <XAxis dataKey="currency" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatBDT(value)} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Spending Trend
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.trend || []}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatBDT(value)} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Category Comparison
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.categoryComparison || []}
                    layout="vertical"
                  >
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value) => formatBDT(value)} />
                    <Bar dataKey="value" fill="#14b8a6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Expenses
          </h3>
        </div>

        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">
            Loading finance data...
          </p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No expenses available in this range.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {transaction.expenseName ||
                      transaction.description ||
                      "Expense"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {transaction.category || "Other"}
                    {transaction.subCategory
                      ? ` • ${transaction.subCategory}`
                      : ""}
                    {` • ${new Date(transaction.date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatBDT(transaction.convertedAmountBDT)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatOriginal(transaction.amount, transaction.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(transaction._id)}
                    className="p-2 rounded-md text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Finance;
