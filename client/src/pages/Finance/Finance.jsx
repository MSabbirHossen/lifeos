import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import Modal from "../../components/Modal";
import API from "../../utils/api";
import {
  DEFAULT_CURRENCIES,
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_TRANSFER_CATEGORIES,
} from "../../data/financeCategories";

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Year", value: "thisYear" },
  { label: "Custom", value: "custom" },
];

const TRANSACTION_FILTERS = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
  { label: "Transfer", value: "transfer" },
];

const TAB_ITEMS = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
  { label: "Transfer", value: "transfer" },
];

const CHART_COLORS = [
  "#06b6d4",
  "#22c55e",
  "#f97316",
  "#eab308",
  "#ef4444",
  "#3b82f6",
  "#14b8a6",
  "#a855f7",
];

const DEFAULT_FORM = {
  transactionType: "expense",
  amount: "",
  currency: "BDT",
  category: "Food",
  subCategory: "Breakfast",
  expenseName: "",
  incomeSource: "",
  transactionName: "",
  description: "",
  paymentMethod: "Cash",
  date: new Date().toISOString().slice(0, 10),
};

const INCOME_SOURCE_EXAMPLES = [
  "Salary",
  "Scholarship",
  "Freelance",
  "Business",
  "Gift",
  "Family Support",
  "Refund",
  "Investment",
  "Other",
];

const formatBDT = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatOriginal = (amount, currency) =>
  `${Number(amount || 0).toFixed(2)} ${currency || "BDT"}`;

const getTxName = (tx = {}) =>
  tx.transactionName ||
  tx.expenseName ||
  tx.incomeSource ||
  tx.source ||
  tx.description ||
  "Transaction";

const Finance = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expenseCategories, setExpenseCategories] = useState(
    DEFAULT_FINANCE_CATEGORIES,
  );
  const [incomeCategories, setIncomeCategories] = useState(
    DEFAULT_INCOME_CATEGORIES,
  );
  const [transferCategories, setTransferCategories] = useState(
    DEFAULT_TRANSFER_CATEGORIES,
  );
  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [rates, setRates] = useState({ BDT: 1, SAR: 32, USD: 120 });

  const [range, setRange] = useState("thisMonth");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [balanceSnapshot, setBalanceSnapshot] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const activeCategories = useMemo(() => {
    if (formData.transactionType === "income") {
      return incomeCategories;
    }
    if (formData.transactionType === "transfer") {
      return transferCategories;
    }
    return expenseCategories;
  }, [
    expenseCategories,
    incomeCategories,
    transferCategories,
    formData.transactionType,
  ]);

  const categoryMap = useMemo(
    () =>
      activeCategories.reduce((acc, item) => {
        acc[item.category] = item.subCategories || [];
        return acc;
      }, {}),
    [activeCategories],
  );

  const availableSubCategories = categoryMap[formData.category] || [];

  const currentNameField =
    formData.transactionType === "income"
      ? "incomeSource"
      : formData.transactionType === "transfer"
        ? "transactionName"
        : "expenseName";

  const currentNameValue = formData[currentNameField] || "";

  const convertedPreview = useMemo(() => {
    const amount = Number(formData.amount);
    const rate = Number(rates?.[formData.currency] || 1);
    if (!amount || Number.isNaN(amount)) {
      return 0;
    }
    return amount * rate;
  }, [formData.amount, formData.currency, rates]);

  const summary = analytics?.summary || {};
  const charts = analytics?.charts || {};

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, transactionFilter]);

  useEffect(() => {
    if (range === "custom" && customRange.startDate && customRange.endDate) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customRange.startDate, customRange.endDate]);

  useEffect(() => {
    if (!activeCategories.length) {
      return;
    }

    const validCategory = activeCategories.find(
      (item) => item.category === formData.category,
    );

    if (!validCategory) {
      const nextCategory = activeCategories[0];
      setFormData((prev) => ({
        ...prev,
        category: nextCategory?.category || "",
        subCategory: nextCategory?.subCategories?.[0] || "",
      }));
      return;
    }

    const validSubCategories = validCategory.subCategories || [];
    if (formData.transactionType !== "expense") {
      if (formData.subCategory) {
        setFormData((prev) => ({ ...prev, subCategory: "" }));
      }
      return;
    }

    if (
      validSubCategories.length &&
      !validSubCategories.includes(formData.subCategory)
    ) {
      setFormData((prev) => ({ ...prev, subCategory: validSubCategories[0] }));
    }
  }, [
    activeCategories,
    formData.category,
    formData.subCategory,
    formData.transactionType,
  ]);

  const initialize = async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, rateResponse] = await Promise.all([
        API.get("/finance/categories").catch(() => null),
        API.get("/finance/rates").catch(() => null),
      ]);

      if (categoryResponse?.data?.data?.expenseCategories?.length) {
        setExpenseCategories(categoryResponse.data.data.expenseCategories);
      }
      if (categoryResponse?.data?.data?.incomeCategories?.length) {
        setIncomeCategories(categoryResponse.data.data.incomeCategories);
      }
      if (categoryResponse?.data?.data?.transferCategories?.length) {
        setTransferCategories(categoryResponse.data.data.transferCategories);
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
      setError("Unable to load finance overview.");
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

    if (transactionFilter !== "all") {
      params.set("transactionType", transactionFilter);
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
      const [
        analyticsResponse,
        cashFlowResponse,
        balanceResponse,
        transactionsResponse,
      ] = await Promise.all([
        API.get(`/finance/analytics?${query}`),
        API.get(`/finance/cash-flow?${query}`).catch(() => ({
          data: { data: [] },
        })),
        API.get("/finance/balance").catch(() => ({ data: { data: null } })),
        API.get(`/finance?${query}`),
      ]);

      setAnalytics(analyticsResponse?.data?.data || null);
      setCashFlow(cashFlowResponse?.data?.data || []);
      setBalanceSnapshot(balanceResponse?.data?.data || null);
      setTransactions(transactionsResponse?.data?.data || []);
    } catch (apiError) {
      setError("Unable to refresh finance analytics.");
    }
  };

  const updateTransactionType = (nextType) => {
    const categoryList =
      nextType === "income"
        ? incomeCategories
        : nextType === "transfer"
          ? transferCategories
          : expenseCategories;

    const firstCategory = categoryList[0]?.category || "";
    const firstSubCategory = categoryList[0]?.subCategories?.[0] || "";

    setFormData((prev) => ({
      ...prev,
      transactionType: nextType,
      category: firstCategory,
      subCategory: nextType === "expense" ? firstSubCategory : "",
      expenseName: nextType === "expense" ? prev.expenseName : "",
      incomeSource: nextType === "income" ? prev.incomeSource : "",
      transactionName: nextType === "transfer" ? prev.transactionName : "",
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchableNameChange = async (value) => {
    setFormData((prev) => ({ ...prev, [currentNameField]: value }));

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data } = await API.get(
        `/finance/suggestions?transactionType=${formData.transactionType}&q=${encodeURIComponent(value)}&limit=8`,
      );
      setSuggestions(data?.data || []);
      setShowSuggestions(true);
    } catch (apiError) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item) => {
    setFormData((prev) => ({
      ...prev,
      [currentNameField]: item.name,
      category: item.category || prev.category,
      subCategory:
        prev.transactionType === "expense"
          ? item.subCategory || prev.subCategory
          : "",
    }));
    setShowSuggestions(false);
  };

  const validateBeforeSubmit = () => {
    const amount = Number(formData.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return "Please provide a valid amount.";
    }

    if (
      formData.transactionType === "expense" &&
      !formData.expenseName.trim()
    ) {
      return "Expense name is required.";
    }

    if (
      formData.transactionType === "income" &&
      !formData.incomeSource.trim()
    ) {
      return "Income source is required.";
    }

    if (
      formData.transactionType === "transfer" &&
      !formData.transactionName.trim()
    ) {
      return "Transfer name is required.";
    }

    return "";
  };

  const resetForm = () => {
    setFormData((prev) => ({
      ...DEFAULT_FORM,
      transactionType: prev.transactionType,
      category: prev.category,
      subCategory: prev.subCategory,
    }));
  };

  const handleSubmit = async () => {
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        transactionType: formData.transactionType,
        type: formData.transactionType,
        amount: Number(formData.amount),
        currency: formData.currency,
        category: formData.category,
        subCategory:
          formData.transactionType === "expense" ? formData.subCategory : "",
        expenseName:
          formData.transactionType === "expense"
            ? formData.expenseName.trim()
            : "",
        incomeSource:
          formData.transactionType === "income"
            ? formData.incomeSource.trim()
            : "",
        transactionName:
          formData.transactionType === "transfer"
            ? formData.transactionName.trim()
            : formData.transactionType === "expense"
              ? formData.expenseName.trim()
              : formData.incomeSource.trim(),
        description: formData.description.trim(),
        paymentMethod: formData.paymentMethod,
        date: formData.date,
      };

      await API.post("/finance/create", payload);
      resetForm();
      setIsModalOpen(false);
      setShowSuggestions(false);
      await refreshData();
    } catch (apiError) {
      const responseMessage =
        apiError?.response?.data?.errors?.[0] ||
        apiError?.response?.data?.message ||
        "Failed to save transaction.";
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
      setError("Failed to delete transaction.");
    }
  };

  const nameFieldLabel =
    formData.transactionType === "income"
      ? "Income Source"
      : formData.transactionType === "transfer"
        ? "Transfer Name"
        : "Expense Name";

  const nameFieldPlaceholder =
    formData.transactionType === "income"
      ? "Search income source (Salary, Scholarship...)"
      : formData.transactionType === "transfer"
        ? "Search transfer history"
        : "Search previous expenses";

  const fallbackIncomeSources = useMemo(
    () =>
      INCOME_SOURCE_EXAMPLES.map((name) => ({
        name,
        category: name,
        subCategory: "",
        count: 0,
        lastUsedLabel: "suggested",
      })),
    [],
  );

  const activeSuggestions =
    suggestions.length > 0 || formData.transactionType !== "income"
      ? suggestions
      : fallbackIncomeSources;

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="rounded-2xl p-5 md:p-6 border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-800/70 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
              Financial Overview
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Personal Cash Flow Manager
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-cyan-500 to-sky-600 text-white border border-cyan-300/30 shadow-lg">
          <p className="text-sm text-cyan-50">Total Balance</p>
          <p className="text-3xl font-bold mt-1">
            {formatBDT(summary.totalBalanceBDT)}
          </p>
          <p className="text-xs mt-2 text-cyan-100">
            Lifetime: {formatBDT(balanceSnapshot?.totalBalanceBDT)}
          </p>
        </Card>
        <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border border-emerald-300/30 shadow-lg">
          <p className="text-sm text-emerald-50">Total Income</p>
          <p className="text-3xl font-bold mt-1">
            {formatBDT(summary.totalIncomeBDT)}
          </p>
          <p className="text-xs mt-2 text-emerald-100">Selected range</p>
        </Card>
        <Card className="bg-gradient-to-r from-rose-500 to-red-600 text-white border border-rose-300/30 shadow-lg">
          <p className="text-sm text-rose-50">Total Expense</p>
          <p className="text-3xl font-bold mt-1">
            {formatBDT(summary.totalExpenseBDT)}
          </p>
          <p className="text-xs mt-2 text-rose-100">
            Savings rate: {Number(summary.savingsRate || 0).toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {TRANSACTION_FILTERS.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setTransactionFilter(item.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  transactionFilter === item.value
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setRange(item.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  range === item.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {range === "custom" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            Cash Flow (Income vs Expense)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cashFlow.length ? cashFlow : charts.cashFlow || []}
              >
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatBDT(value)} />
                <Bar dataKey="income" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Balance Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.balanceTrend || []}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatBDT(value)} />
                <Line
                  type="monotone"
                  dataKey="openingBalance"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="closingBalance"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Expense Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.expenseDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {(charts.expenseDistribution || []).map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
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
            Income Sources
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.incomeSources || []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {(charts.incomeSources || []).map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatBDT(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white/50 dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">
            Loading transactions...
          </p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No transactions found.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 12).map((transaction) => {
              const txType =
                transaction.transactionType || transaction.type || "expense";
              const isIncome = txType === "income";
              const isExpense = txType === "expense";

              return (
                <div
                  key={transaction._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {getTxName(transaction)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(transaction.category || "Other") +
                        (transaction.subCategory
                          ? ` • ${transaction.subCategory}`
                          : "")}
                      {` • ${new Date(transaction.date).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          isIncome
                            ? "text-emerald-600"
                            : isExpense
                              ? "text-rose-600"
                              : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {isIncome ? "+" : isExpense ? "-" : "~"}
                        {formatBDT(transaction.convertedAmountBDT)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatOriginal(
                          transaction.amount,
                          transaction.currency,
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction._id)}
                      className="p-2 rounded-md text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitLabel={saving ? "Saving..." : "Save Transaction"}
        title="Quick Add Transaction"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TAB_ITEMS.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => updateTransactionType(tab.value)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  formData.transactionType === tab.value
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {activeCategories.map((item) => (
                  <option key={item.category} value={item.category}>
                    {item.category}
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
                {paymentMethods.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.transactionType === "expense" &&
            availableSubCategories.length > 0 && (
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
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {availableSubCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

          <div className="relative">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              {nameFieldLabel}
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={currentNameValue}
                onChange={(event) =>
                  handleSearchableNameChange(event.target.value)
                }
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                className="w-full pl-9 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder={nameFieldPlaceholder}
              />
            </div>

            {showSuggestions && activeSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                {activeSuggestions.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.name}-${index}`}
                    onClick={() => selectSuggestion(item)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Used {item.count || 0} times • Last{" "}
                      {item.lastUsedLabel || "suggested"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Converted Preview
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {formatOriginal(formData.amount || 0, formData.currency)} ≈{" "}
                {formatBDT(convertedPreview)}
              </p>
            </div>
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
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Finance;
