import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import {
  Archive,
  BarChart3,
  BookOpen,
  CalendarRange,
  Clock3,
  PencilLine,
  Plus,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatMinutes,
  formatRelativeStudyDate,
  formatStudyDate,
  getRangeLabel,
  normalizeStudyName,
  toDateInputValue,
} from "../../utils/study";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const CHART_COLORS = [
  "#0f766e",
  "#2563eb",
  "#ea580c",
  "#16a34a",
  "#db2777",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
];

const emptyAnalytics = {
  totalMinutes: 0,
  summary: {
    todayMinutes: 0,
    last7DaysMinutes: 0,
    monthMinutes: 0,
    allTimeMinutes: 0,
  },
  subjectDistribution: [],
  dailyTimeline: [],
  progress: [],
};

const initialSessionForm = {
  subjectId: "",
  subjectInput: "",
  topic: "",
  duration: 60,
  notes: "",
  date: toDateInputValue(new Date()),
};

const initialPlanForm = {
  id: "",
  subjectId: "",
  estimatedHours: 0,
  completedHours: 0,
  targetDate: "",
  totalTopics: 0,
  completedTopics: 0,
  notes: "",
};

const extractPayload = (response) =>
  response?.data?.data || response?.data || [];

const Study = () => {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [range, setRange] = useState("7days");
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [sessionForm, setSessionForm] = useState(initialSessionForm);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [renamingSubjectId, setRenamingSubjectId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");

  const activeSubjects = useMemo(
    () => subjects.filter((subject) => !subject.archived),
    [subjects],
  );

  const normalizedSubjectInput = normalizeStudyName(sessionForm.subjectInput);
  const selectedSubject = activeSubjects.find(
    (subject) => subject._id === sessionForm.subjectId,
  );

  const subjectSuggestions = useMemo(() => {
    const query = sessionForm.subjectInput.trim().toLowerCase();

    return activeSubjects
      .filter((subject) => {
        if (!query) {
          return true;
        }

        return subject.name.toLowerCase().includes(query);
      })
      .slice(0, 6);
  }, [activeSubjects, sessionForm.subjectInput]);

  const matchingSubject = activeSubjects.find(
    (subject) => subject.normalizedName === normalizedSubjectInput,
  );

  const topicSuggestions = useMemo(() => {
    const subjectKey =
      selectedSubject?.normalizedName || normalizedSubjectInput;
    const query = sessionForm.topic.trim().toLowerCase();
    const seen = new Set();

    return sessions
      .filter((session) => {
        const sessionSubjectKey =
          session.subjectId?.normalizedName ||
          session.normalizedSubject ||
          normalizeStudyName(session.subject);

        if (!subjectKey || sessionSubjectKey !== subjectKey) {
          return false;
        }

        if (!query) {
          return true;
        }

        return session.topic.toLowerCase().includes(query);
      })
      .filter((session) => {
        const key =
          session.normalizedTopic || normalizeStudyName(session.topic);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((session) => session.topic)
      .slice(0, 6);
  }, [normalizedSubjectInput, selectedSubject, sessionForm.topic, sessions]);

  const displayedSubjects = useMemo(() => {
    const progressById = new Map(
      (analytics.progress || []).map((entry) => [entry.subjectId, entry]),
    );

    return activeSubjects
      .map((subject) => {
        const progress = progressById.get(subject._id) || {
          subjectId: subject._id,
          name: subject.name,
          totalMinutes: 0,
          totalHours: 0,
          topicsCompleted: 0,
          totalTopics: 0,
          completedTopics: 0,
          progressPercent: 0,
          lastStudiedAt: null,
          remainingHours: 0,
          estimatedHours: 0,
          targetDate: null,
          neglectedDays: null,
        };

        return {
          ...subject,
          ...progress,
        };
      })
      .sort(
        (left, right) =>
          right.totalMinutes - left.totalMinutes ||
          left.name.localeCompare(right.name),
      );
  }, [activeSubjects, analytics.progress]);

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const params = new URLSearchParams({ range });
      if (range === "custom") {
        if (customRange.startDate) {
          params.set("startDate", customRange.startDate);
        }
        if (customRange.endDate) {
          params.set("endDate", customRange.endDate);
        }
      }

      const response = await API.get(`/study/analytics?${params.toString()}`);
      setAnalytics(response?.data?.data || emptyAnalytics);
    } catch (requestError) {
      setAnalytics(emptyAnalytics);
      setError("Unable to load study analytics right now.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [subjectResponse, sessionResponse, planResponse] =
        await Promise.all([
          API.get("/study/subjects", { params: { includeArchived: true } }),
          API.get("/study/sessions"),
          API.get("/study/plans"),
        ]);

      setSubjects(extractPayload(subjectResponse));
      setSessions(extractPayload(sessionResponse));
      setPlans(extractPayload(planResponse));
    } catch (requestError) {
      setError("Unable to load the study workspace right now.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([loadPageData(), loadAnalytics()]);
  };

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (
      range === "custom" &&
      (!customRange.startDate || !customRange.endDate)
    ) {
      return;
    }

    loadAnalytics();
  }, [range, customRange.endDate, customRange.startDate]);

  const openSessionModal = () => {
    setSessionForm(initialSessionForm);
    setIsSessionModalOpen(true);
  };

  const openPlanModal = (subject = null) => {
    if (subject) {
      const existingPlan = plans.find((plan) => plan.subjectId === subject._id);
      setPlanForm(
        existingPlan
          ? {
              id: existingPlan._id || "",
              subjectId: existingPlan.subjectId,
              estimatedHours: existingPlan.estimatedHours || 0,
              completedHours: existingPlan.completedHours || 0,
              targetDate: toDateInputValue(existingPlan.targetDate),
              totalTopics: existingPlan.totalTopics || 0,
              completedTopics: existingPlan.completedTopics || 0,
              notes: existingPlan.notes || "",
            }
          : {
              ...initialPlanForm,
              subjectId: subject._id,
            },
      );
    } else {
      setPlanForm(initialPlanForm);
    }

    setIsPlanModalOpen(true);
  };

  const selectSubject = (subject) => {
    setSessionForm((current) => ({
      ...current,
      subjectId: subject._id,
      subjectInput: subject.name,
    }));
  };

  const createSubject = async (name, { refresh = true } = {}) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }

    const response = await API.post("/study/subjects", { name: trimmedName });
    const subject = response?.data?.data;

    if (subject) {
      setSessionForm((current) => ({
        ...current,
        subjectId: subject._id,
        subjectInput: subject.name,
      }));
    }

    if (refresh) {
      await loadPageData();
    }

    return subject;
  };

  const handleSessionSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      let subjectId = sessionForm.subjectId;
      let subjectName = sessionForm.subjectInput.trim();

      if (!subjectName) {
        setError("Subject is required.");
        return;
      }

      if (!sessionForm.topic.trim()) {
        setError("Topic is required.");
        return;
      }

      if (!Number(sessionForm.duration)) {
        setError("Duration must be greater than zero.");
        return;
      }

      if (!subjectId) {
        const createdSubject = await createSubject(subjectName, {
          refresh: false,
        });
        subjectId = createdSubject?._id || "";
        subjectName = createdSubject?.name || subjectName;
      }

      await API.post("/study/sessions", {
        subjectId: subjectId || undefined,
        subject: subjectName,
        topic: sessionForm.topic.trim(),
        duration: Number(sessionForm.duration),
        notes: sessionForm.notes,
        date: sessionForm.date || undefined,
      });

      setIsSessionModalOpen(false);
      setSessionForm(initialSessionForm);
      await refreshAllData();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.[0] ||
        "Unable to save this study session.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSessionDelete = async (sessionId) => {
    try {
      await API.delete(`/study/sessions/${sessionId}`);
      await refreshAllData();
    } catch (requestError) {
      setError("Unable to delete this study session.");
    }
  };

  const handlePlanSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      if (!planForm.subjectId) {
        setError("Select a subject for the plan.");
        return;
      }

      const payload = {
        subjectId: planForm.subjectId,
        estimatedHours: Number(planForm.estimatedHours) || 0,
        completedHours: Number(planForm.completedHours) || 0,
        targetDate: planForm.targetDate || null,
        totalTopics: Number(planForm.totalTopics) || 0,
        completedTopics: Number(planForm.completedTopics) || 0,
        notes: planForm.notes,
      };

      if (planForm.id) {
        await API.patch(`/study/plans/${planForm.id}`, payload);
      } else {
        await API.post("/study/plans", payload);
      }

      setIsPlanModalOpen(false);
      setPlanForm(initialPlanForm);
      await refreshAllData();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.[0] ||
        "Unable to save this study plan.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectArchive = async (subjectId, archived = true) => {
    try {
      if (archived) {
        await API.delete(`/study/subjects/${subjectId}`);
      } else {
        await API.patch(`/study/subjects/${subjectId}`, { archived: false });
      }

      await refreshAllData();
    } catch (requestError) {
      setError("Unable to update this subject.");
    }
  };

  const handleSubjectRename = async (subjectId) => {
    try {
      if (!renameDraft.trim()) {
        return;
      }

      await API.patch(`/study/subjects/${subjectId}`, { name: renameDraft });
      setRenamingSubjectId("");
      setRenameDraft("");
      await refreshAllData();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Unable to rename this subject.";
      setError(message);
    }
  };

  const handleNewSubjectSubmit = async () => {
    try {
      await createSubject(newSubjectName);
      setNewSubjectName("");
      await refreshAllData();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || "Unable to add this subject.";
      setError(message);
    }
  };

  const archivedSubjects = subjects.filter((subject) => subject.archived);
  const recentSessions = sessions.slice(0, 10);
  const summaryCards = [
    {
      label: "Today",
      value: formatMinutes(analytics.summary.todayMinutes),
      icon: Clock3,
      tone: "text-teal-600 dark:text-teal-300",
    },
    {
      label: "Last 7 Days",
      value: formatMinutes(analytics.summary.last7DaysMinutes),
      icon: CalendarRange,
      tone: "text-blue-600 dark:text-blue-300",
    },
    {
      label: "This Month",
      value: formatMinutes(analytics.summary.monthMinutes),
      icon: BarChart3,
      tone: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "All Time",
      value: formatMinutes(analytics.summary.allTimeMinutes),
      icon: Target,
      tone: "text-emerald-600 dark:text-emerald-300",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Card className="overflow-hidden border border-teal-100 dark:border-gray-700 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 shadow-sm dark:bg-gray-900/60 dark:text-teal-300">
              <BookOpen size={14} /> Academic OS
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
                Study Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 md:text-base">
                Track every minute, eliminate backlog, and turn each subject
                into a measurable progress lane.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-gray-900/60">
                {displayedSubjects.length} active subjects
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-gray-900/60">
                {recentSessions.length} recent logs
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 dark:bg-gray-900/60">
                Focus range: {getRangeLabel(range)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openSessionModal}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-white transition hover:bg-teal-700"
            >
              <Plus size={18} /> Log Study
            </button>
            <button
              onClick={() => openPlanModal()}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2 text-teal-700 transition hover:border-teal-300 hover:bg-teal-50 dark:border-gray-600 dark:bg-gray-800 dark:text-teal-200 dark:hover:bg-gray-700"
            >
              <Target size={18} /> Plan Subject
            </button>
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <PencilLine size={18} /> Manage Subjects
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`rounded-xl bg-gray-100 p-3 dark:bg-gray-700 ${card.tone}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Time Investment Timeline
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {analyticsLoading
                  ? "Refreshing timeline..."
                  : `${formatMinutes(analytics.totalMinutes)} logged in ${getRangeLabel(range).toLowerCase()}.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRange(option.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    range === option.value
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {range === "custom" && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="date"
                value={customRange.startDate}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                value={customRange.endDate}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div className="mt-6 h-[320px]">
            {analytics.dailyTimeline.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Start logging sessions to see your daily study pattern.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyTimeline}>
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    formatter={(value) => [formatMinutes(value), "Study Time"]}
                  />
                  <Bar
                    dataKey="minutes"
                    fill="#0f766e"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Subject Time Distribution
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Which subjects are taking most of your time.
              </p>
            </div>
            <BarChart3 className="text-teal-600 dark:text-teal-300" size={22} />
          </div>

          <div className="mt-6 h-[320px]">
            {analytics.subjectDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No distribution yet. Log the first session to start comparing
                subjects.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.subjectDistribution}
                    dataKey="minutes"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    label={({ name, share }) => `${name} ${share}%`}
                  >
                    {analytics.subjectDistribution.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatMinutes(value), "Study Time"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subjects
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progress, effort, and backlog visibility for each subject.
            </p>
          </div>
        </div>

        {loading ? (
          <Card>Loading study workspace...</Card>
        ) : displayedSubjects.length === 0 ? (
          <Card className="border border-dashed border-gray-200 text-center dark:border-gray-700">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              No active subjects yet
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Create a subject or log a study session to build your academic
              board.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {displayedSubjects.map((subject) => (
              <Card
                key={subject._id}
                className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last studied:{" "}
                        {formatRelativeStudyDate(subject.lastStudiedAt)}
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>Progress</span>
                        <span>{subject.progressPercent}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500"
                          style={{
                            width: `${Math.min(subject.progressPercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/70">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Total Time
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {formatMinutes(subject.totalMinutes)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/70">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Topics Completed
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {subject.completedTopics || subject.topicsCompleted}
                          {subject.totalTopics ? `/${subject.totalTopics}` : ""}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/70">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Remaining
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {subject.remainingHours
                            ? `${subject.remainingHours}h`
                            : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/70">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Target Date
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {subject.targetDate
                            ? formatStudyDate(subject.targetDate)
                            : "Open-ended"}
                        </p>
                      </div>
                    </div>

                    {subject.neglectedDays >= 7 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                        {subject.name} has not been studied for{" "}
                        {subject.neglectedDays} days.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 self-start">
                    <button
                      onClick={() => openPlanModal(subject)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-teal-300 hover:text-teal-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
                    >
                      <Target size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setRenamingSubjectId(subject._id);
                        setRenameDraft(subject.name);
                        setIsSubjectModalOpen(true);
                      }}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
                    >
                      <PencilLine size={18} />
                    </button>
                    <button
                      onClick={() => handleSubjectArchive(subject._id, true)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-red-300 hover:text-red-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-red-400 dark:hover:text-red-300"
                    >
                      <Archive size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recent Study Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The latest sessions captured across all subjects.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No study logs yet. Add your first focused session to start
              building a timeline.
            </div>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session._id}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/70 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {session.topic}
                    </h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-teal-700 shadow-sm dark:bg-gray-700 dark:text-teal-300">
                      {session.subject}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatStudyDate(session.date)}
                  </p>
                  {session.notes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {session.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatMinutes(session.duration)}
                  </span>
                  <button
                    onClick={() => handleSessionDelete(session._id)}
                    className="inline-flex items-center gap-1 text-sm text-red-500 transition hover:text-red-700"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        isOpen={isSessionModalOpen}
        title="Log Study Session"
        onClose={() => setIsSessionModalOpen(false)}
        onSubmit={handleSessionSubmit}
        submitLabel={isSubmitting ? "Saving..." : "Save Session"}
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={sessionForm.subjectInput}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      subjectInput: event.target.value,
                      subjectId:
                        current.subjectId &&
                        event.target.value !== selectedSubject?.name
                          ? ""
                          : current.subjectId,
                    }))
                  }
                  placeholder="Search or create a subject"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {(subjectSuggestions.length > 0 ||
                (sessionForm.subjectInput.trim() && !matchingSubject)) && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-600 dark:bg-gray-800">
                  {subjectSuggestions.map((subject) => (
                    <button
                      key={subject._id}
                      onClick={() => selectSubject(subject)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <span>{subject.name}</span>
                      <span className="text-xs text-gray-400">existing</span>
                    </button>
                  ))}

                  {sessionForm.subjectInput.trim() && !matchingSubject && (
                    <button
                      onClick={() => createSubject(sessionForm.subjectInput)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/30"
                    >
                      <span>
                        Create new subject: {sessionForm.subjectInput.trim()}
                      </span>
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sessionForm.topic}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    topic: event.target.value,
                  }))
                }
                placeholder="Search past topics or log a new one"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />

              {topicSuggestions.length > 0 && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-600 dark:bg-gray-800">
                  {topicSuggestions.map((topic) => (
                    <button
                      key={topic}
                      onClick={() =>
                        setSessionForm((current) => ({
                          ...current,
                          topic,
                        }))
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <span>{topic}</span>
                      <span className="text-xs text-gray-400">suggested</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={sessionForm.duration}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    duration: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                value={sessionForm.date}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              rows="4"
              value={sessionForm.notes}
              onChange={(event) =>
                setSessionForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="What did you cover, understand, or struggle with?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPlanModalOpen}
        title="Plan Subject"
        onClose={() => setIsPlanModalOpen(false)}
        onSubmit={handlePlanSubmit}
        submitLabel={isSubmitting ? "Saving..." : "Save Plan"}
        maxWidthClass="max-w-3xl"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={planForm.subjectId}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  subjectId: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a subject</option>
              {activeSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Target Completion Date
            </label>
            <input
              type="date"
              value={planForm.targetDate}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  targetDate: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total Estimated Hours
            </label>
            <input
              type="number"
              min="0"
              value={planForm.estimatedHours}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  estimatedHours: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Completed Hours
            </label>
            <input
              type="number"
              min="0"
              value={planForm.completedHours}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  completedHours: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total Topics Planned
            </label>
            <input
              type="number"
              min="0"
              value={planForm.totalTopics}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  totalTopics: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Completed Topics
            </label>
            <input
              type="number"
              min="0"
              value={planForm.completedTopics}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  completedTopics: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              rows="4"
              value={planForm.notes}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Add backlog details, milestone notes, or completion criteria."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSubjectModalOpen}
        title="Manage Subjects"
        onClose={() => {
          setIsSubjectModalOpen(false);
          setRenamingSubjectId("");
          setRenameDraft("");
        }}
        onSubmit={handleNewSubjectSubmit}
        submitLabel="Add Subject"
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              New Subject
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(event) => setNewSubjectName(event.target.value)}
                placeholder="Add a subject to your study system"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Active Subjects
            </h3>
            {activeSubjects.map((subject) => (
              <div
                key={subject._id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                {renamingSubjectId === subject._id ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubjectRename(subject._id)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setRenamingSubjectId("");
                          setRenameDraft("");
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {subject.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatMinutes(
                          displayedSubjects.find(
                            (entry) => entry._id === subject._id,
                          )?.totalMinutes || 0,
                        )}{" "}
                        total logged
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRenamingSubjectId(subject._id);
                          setRenameDraft(subject.name);
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleSubjectArchive(subject._id, true)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {archivedSubjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Archived Subjects
              </h3>
              {archivedSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {subject.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Hidden from new study logs, preserved in previous records.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSubjectArchive(subject._id, false)}
                    className="rounded-lg border border-teal-200 px-3 py-2 text-teal-700 transition hover:bg-teal-50 dark:border-teal-900/60 dark:text-teal-300 dark:hover:bg-teal-950/30"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Study;
