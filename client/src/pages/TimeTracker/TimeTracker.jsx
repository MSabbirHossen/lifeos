import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import {
  BarChart3,
  CalendarRange,
  Clock3,
  AlertTriangle,
  LayoutList,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatDateLabel,
  formatDuration,
  formatRangeLabel,
  formatTimeLabel,
  toDateTimeLocalValue,
} from "../../utils/timeTracker";

const DEFAULT_CATEGORIES = [
  { name: "Organizational Work", bangla: "সাংগঠনিক কাজ" },
  { name: "Organizational Study", bangla: "সাংগঠনিক অধ্যয়ন" },
  { name: "Textbook Study", bangla: "পাঠ্যপুস্তক অধ্যয়ন" },
  { name: "Class Time", bangla: "ক্লাস টাইম" },
  { name: "Table Work", bangla: "টেবিল ওয়ার্ক" },
  { name: "Sleep & Rest", bangla: "ঘুম+বিশ্রাম" },
  { name: "Wasted Time", bangla: "সময় অপচয়" },
];

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Date Range" },
];

const VIEW_OPTIONS = [
  { value: "category", label: "Category Based", icon: LayoutList },
  { value: "task", label: "Task Based", icon: BarChart3 },
];

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const emptyAnalyticsState = {
  totalSeconds: 0,
  categoryDistribution: [],
  taskDistribution: [],
  dailySeries: [],
  entries: [],
};

const TimeTracker = () => {
  const [trackers, setTrackers] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [analytics, setAnalytics] = useState(emptyAnalyticsState);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState(null);
  const [range, setRange] = useState("today");
  const [chartView, setChartView] = useState("category");
  const [taskSuggestions, setTaskSuggestions] = useState([]);
  const [formData, setFormData] = useState({
    taskName: "",
    taskId: "",
    category: DEFAULT_CATEGORIES[0].name,
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });

  const currentDistribution =
    chartView === "category"
      ? analytics.categoryDistribution
      : analytics.taskDistribution;

  const timelineEntries = analytics.entries || [];
  const visibleTrackers = trackers;

  const latestTrackerEndTime = useMemo(() => {
    if (!visibleTrackers.length) {
      return new Date();
    }

    return visibleTrackers[0]?.endTime || new Date();
  }, [visibleTrackers]);

  const totalHours = Math.round((analytics.totalSeconds / 3600) * 10) / 10;

  const loadCategories = async () => {
    try {
      const { data } = await API.get("/time-tracker/categories");
      const nextCategories = data?.data?.length
        ? data.data
        : DEFAULT_CATEGORIES;
      setCategories(nextCategories);

      setFormData((current) => ({
        ...current,
        category:
          current.category ||
          nextCategories[0]?.name ||
          DEFAULT_CATEGORIES[0].name,
      }));
    } catch (requestError) {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const loadTrackers = async () => {
    const { data } = await API.get("/time-tracker");
    setTrackers(data?.data || data || []);
  };

  const buildAnalyticsParams = () => {
    const params = new URLSearchParams({ range });

    if (range === "custom") {
      if (customRange.startDate) {
        params.set("startDate", customRange.startDate);
      }

      if (customRange.endDate) {
        params.set("endDate", customRange.endDate);
      }
    }

    return params;
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params = buildAnalyticsParams();
      const { data } = await API.get(
        `/time-tracker/analytics?${params.toString()}`,
      );
      setAnalytics(data?.data || emptyAnalyticsState);
    } catch (requestError) {
      setAnalytics(emptyAnalyticsState);
      if (
        !requestError.response?.status ||
        requestError.response.status >= 500
      ) {
        setError("Unable to load time investment overview right now.");
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadTaskSuggestions = async (query = "") => {
    try {
      const { data } = await API.get("/tasks/search", {
        params: { q: query },
      });
      setTaskSuggestions(data?.data || []);
    } catch (requestError) {
      setTaskSuggestions([]);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadCategories(), loadTrackers(), loadAnalytics()]);
      await loadTaskSuggestions("");
    } catch (requestError) {
      setError("Unable to load time entries right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (
      range === "custom" &&
      (!customRange.startDate || !customRange.endDate)
    ) {
      return;
    }

    loadAnalytics();
  }, [range, customRange.startDate, customRange.endDate]);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadTaskSuggestions(formData.taskName.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [formData.taskName, isModalOpen]);

  const refreshData = async () => {
    await Promise.all([
      loadTrackers(),
      loadTaskSuggestions(formData.taskName.trim()),
      loadAnalytics(),
    ]);
  };

  const openCreateModal = () => {
    const category = categories[0]?.name || DEFAULT_CATEGORIES[0].name;

    setEditingTrackerId(null);
    setFormData({
      taskName: "",
      taskId: "",
      category,
      startTime: toDateTimeLocalValue(latestTrackerEndTime),
      endTime: "",
      notes: "",
    });
    setTaskSuggestions([]);
    setIsModalOpen(true);
    loadTaskSuggestions("");
  };

  const openEditModal = (tracker) => {
    setEditingTrackerId(tracker._id);
    setFormData({
      taskName: tracker.task?.name || "",
      taskId: tracker.task?.id || "",
      category:
        tracker.category || categories[0]?.name || DEFAULT_CATEGORIES[0].name,
      startTime: toDateTimeLocalValue(tracker.startTime),
      endTime: toDateTimeLocalValue(tracker.endTime),
      notes: tracker.notes || "",
    });
    setTaskSuggestions([]);
    setIsModalOpen(true);
    loadTaskSuggestions(tracker.task?.name || "");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrackerId(null);
  };

  const handleTaskSelect = (task) => {
    setFormData((current) => ({
      ...current,
      taskName: task.name,
      taskId: task._id,
    }));

    API.post("/tasks", {
      name: task.name,
      category: task.category || formData.category,
    }).catch(() => undefined);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      if (!formData.taskName.trim()) {
        setError("Task name is required.");
        return;
      }

      if (!formData.startTime || !formData.endTime) {
        setError("Start time and end time are required.");
        return;
      }

      const payload = {
        taskName: formData.taskName,
        taskId: formData.taskId || undefined,
        category: formData.category,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        notes: formData.notes,
      };

      if (editingTrackerId) {
        await API.put(`/time-tracker/${editingTrackerId}`, payload);
      } else {
        await API.post("/time-tracker", payload);
      }

      setFormData({
        taskName: "",
        taskId: "",
        category: categories[0]?.name || DEFAULT_CATEGORIES[0].name,
        startTime: "",
        endTime: "",
        notes: "",
      });
      closeModal();
      await refreshData();
    } catch (requestError) {
      const serverMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.join?.(" ") ||
        "Unable to save this time entry.";
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm(
      "Delete this time entry? This cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await API.delete(`/time-tracker/${id}`);
      await refreshData();
    } catch (requestError) {
      setError("Unable to delete this time entry.");
    }
  };

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);

    if (nextRange === "custom") {
      const today = new Date();
      const previousWeek = new Date();
      previousWeek.setDate(today.getDate() - 6);

      setCustomRange({
        startDate: previousWeek.toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10),
      });
    }
  };

  const pieData = useMemo(
    () =>
      currentDistribution.map((item) => ({
        name: item.name,
        value: item.seconds,
      })),
    [currentDistribution],
  );

  const barData = useMemo(
    () =>
      currentDistribution.slice(0, 8).map((item) => ({
        name: item.name,
        seconds: item.seconds,
      })),
    [currentDistribution],
  );

  const dailyBarData = useMemo(
    () =>
      (analytics.dailySeries || []).map((entry) => ({
        name: formatDateLabel(entry.date),
        seconds: entry.seconds,
      })),
    [analytics.dailySeries],
  );

  const selectedRangeLabel = formatRangeLabel(range);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 dark:text-gray-400">
        Loading entries...
      </div>
    );
  }

  return (
    <div className="relative p-6 space-y-6 bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 min-h-full">
      <div className="absolute inset-x-6 top-6 h-40 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-500/30 dark:bg-gray-900/70 dark:text-blue-300">
            <Clock3 size={14} />
            Life logging
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Time Tracker
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Track every task, analyze where your time goes, and keep a clean
              flow from one activity to the next.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <Plus size={18} />
          Start Task
        </button>
      </div>

      {error ? (
        <Card className="border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        </Card>
      ) : null}

      <Card className="border border-white/60 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-gray-700 dark:bg-gray-800/85 dark:shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
              Time Investment Overview
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {selectedRangeLabel}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {analytics.totalSeconds > 0
                ? `${formatDuration(analytics.totalSeconds)} logged across ${analytics.entries.length} entries.`
                : "No activity recorded in this range yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRangeChange(option.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  range === option.value
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <CalendarRange size={15} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {range === "custom" ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Start Date
              </span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                End Date
              </span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Total Time
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {formatDuration(analytics.totalSeconds)}
            </p>
          </Card>
          <Card className="border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Tracked Tasks
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {currentDistribution.length}
            </p>
          </Card>
          <Card className="border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Logged Hours
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {totalHours.toFixed(1)}h
            </p>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                onClick={() => setChartView(option.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  chartView === option.value
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Icon size={15} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-gray-100 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {chartView === "category" ? "Category Split" : "Task Split"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Donut chart for proportional time investment.
                </p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Loading analytics...
              </div>
            ) : pieData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`slice-${entry.name}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatDuration(value)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <LayoutList className="mb-3" size={28} />
                <p>No activity recorded in this range.</p>
              </div>
            )}
          </Card>

          <Card className="border border-gray-100 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daily Flow
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  A quick bar view of how time moved across the selected range.
                </p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Loading analytics...
              </div>
            ) : dailyBarData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBarData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => formatDuration(value)} />
                    <Tooltip formatter={(value) => formatDuration(value)} />
                    <Bar
                      dataKey="seconds"
                      radius={[8, 8, 0, 0]}
                      fill="#2563eb"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <BarChart3 className="mb-3" size={28} />
                <p>No flow data available yet.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-gray-100 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {chartView === "category" ? "Top Categories" : "Top Tasks"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compare the most time-consuming items in the selected view.
                </p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Loading analytics...
              </div>
            ) : barData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => formatDuration(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => formatDuration(value)} />
                    <Bar
                      dataKey="seconds"
                      radius={[0, 8, 8, 0]}
                      fill="#16a34a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <Search className="mb-3" size={28} />
                <p>No distribution data for this view.</p>
              </div>
            )}
          </Card>

          <Card className="border border-gray-100 dark:border-gray-700">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daily Activity Flow
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Timeline view of the selected range.
                </p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Loading analytics...
              </div>
            ) : timelineEntries.length ? (
              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {timelineEntries.map((entry, index) => (
                  <div key={entry.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-blue-500" />
                    {index !== timelineEntries.length - 1 ? (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-blue-200 dark:bg-blue-500/30" />
                    ) : null}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/70">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {entry.task?.name || "Untitled Task"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.category}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatTimeLabel(entry.startTime)} -{" "}
                          {formatTimeLabel(entry.endTime)}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="rounded-full bg-white px-3 py-1 shadow-sm dark:bg-gray-900">
                          {formatDuration(entry.durationSeconds)}
                        </span>
                        {entry.notes ? (
                          <span className="rounded-full bg-white px-3 py-1 shadow-sm dark:bg-gray-900">
                            {entry.notes}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <Clock3 className="mb-3" size={28} />
                {range === "today" ? (
                  <>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      No activity recorded today
                    </p>
                    <p className="mt-1">Start tracking your first task.</p>
                  </>
                ) : (
                  <p>No activity recorded in this range.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </Card>

      <div className="grid gap-4">
        {visibleTrackers.length === 0 ? (
          <Card>
            <div className="flex items-start gap-3">
              <Clock3
                className="mt-0.5 text-blue-600 dark:text-blue-300"
                size={20}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No saved logs yet
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Start tracking your first task to build your life log history.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          visibleTrackers.map((tracker) => (
            <Card
              key={tracker._id}
              className="border border-gray-100 dark:border-gray-700"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {tracker.task?.name || "Untitled Task"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tracker.task?.normalizedName
                        ? "Saved task"
                        : "Task entry"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">
                      {tracker.category}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">
                      {formatTimeLabel(tracker.startTime)} -{" "}
                      {formatTimeLabel(tracker.endTime)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">
                      {formatDuration(tracker.durationSeconds)}
                    </span>
                    {tracker.notes ? (
                      <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">
                        {tracker.notes}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <button
                    onClick={() => openEditModal(tracker)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
                  >
                    <PencilLine size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tracker._id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingTrackerId ? "Edit Time Entry" : "Track Time"}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={
          isSubmitting
            ? "Saving..."
            : editingTrackerId
              ? "Update Entry"
              : "Save Entry"
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <label
              htmlFor="time-task"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Task Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="time-task"
                type="text"
                value={formData.taskName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    taskName: event.target.value,
                    taskId: "",
                  }))
                }
                onFocus={() => loadTaskSuggestions(formData.taskName.trim())}
                placeholder="Search or create a task"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <Search
                className="absolute right-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>

            {taskSuggestions.length ? (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {taskSuggestions.map((task) => (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => handleTaskSelect(task)}
                    className="flex w-full items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 transition last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <span>{task.name}</span>
                    <span className="text-xs text-gray-400">
                      {task.lastUsed
                        ? `Used ${formatDateLabel(task.lastUsed)}`
                        : "Recent"}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="time-category"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="time-category"
              value={formData.category}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.bangla} - {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="time-start"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                id="time-start"
                type="datetime-local"
                value={formData.startTime}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="time-end"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                id="time-end"
                type="datetime-local"
                value={formData.endTime}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="time-notes"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Notes
            </label>
            <textarea
              id="time-notes"
              value={formData.notes}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              placeholder="Optional note about this activity"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TimeTracker;
