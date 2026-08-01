import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import API from "../../utils/api";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Flame,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

const defaultFormData = {
  title: "",
  mood: "happy",
  activities: [],
  highlights: [],
  notes: "",
};

const moodConfig = {
  happy: { label: "Happy", emoji: "😀", color: "#34d399", score: 5 },
  neutral: { label: "Neutral", emoji: "😐", color: "#94a3b8", score: 3 },
  sad: { label: "Sad", emoji: "😔", color: "#60a5fa", score: 1 },
  motivated: { label: "Motivated", emoji: "🔥", color: "#fb923c", score: 5 },
  stressed: { label: "Stressed", emoji: "😰", color: "#fb7185", score: 2 },
  grateful: { label: "Grateful", emoji: "🙏", color: "#818cf8", score: 4 },
  excited: { label: "Excited", emoji: "✨", color: "#facc15", score: 5 },
  anxious: { label: "Anxious", emoji: "🌫️", color: "#e879f9", score: 2 },
  calm: { label: "Calm", emoji: "🕊️", color: "#22d3ee", score: 4 },
};

const moodChoices = [
  "happy",
  "neutral",
  "sad",
  "motivated",
  "stressed",
  "grateful",
];

const reflectionCategories = [
  "Future Planning",
  "Self Growth",
  "Relationships",
  "Mindfulness",
  "Productivity",
  "Gratitude",
];

const draftStorageKey = "lifeos-journal-draft-v3";
const favoritesStorageKey = "lifeos-journal-favorites";

const pageClass =
  "min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 md:p-6";
const surfaceClass =
  "rounded-2xl border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-800/70 backdrop-blur-md shadow-xl";
const focusRingClass =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const normalizeHighlights = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getWordCount = (text = "") => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
};

const getReadingMinutes = (wordCount) => {
  if (!wordCount) {
    return 0;
  }
  return Math.max(1, Math.ceil(wordCount / 180));
};

const Journal = () => {
  const shouldReduceMotion = useReducedMotion();

  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState("");
  const [formData, setFormData] = useState(defaultFormData);
  const [highlightInput, setHighlightInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState("");
  const [reflectionQuestion, setReflectionQuestion] = useState(null);
  const [selectedReflectionCategory, setSelectedReflectionCategory] = useState(
    reflectionCategories[0],
  );

  const [draftStatus, setDraftStatus] = useState("Draft idle");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [activeEntryId, setActiveEntryId] = useState("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(favoritesStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [queuedMood, setQueuedMood] = useState("");

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    const hasContent =
      formData.title.trim() ||
      formData.notes.trim() ||
      formData.highlights.length > 0 ||
      formData.mood !== defaultFormData.mood;

    if (!hasContent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          ...formData,
          editingJournalId,
          selectedReflectionCategory,
          reflectionQuestion,
          savedAt: new Date().toISOString(),
        }),
      );
      setDraftStatus(`Autosaved at ${new Date().toLocaleTimeString()}`);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    isComposerOpen,
    formData,
    editingJournalId,
    selectedReflectionCategory,
    reflectionQuestion,
  ]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAssistantOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isComposerOpen || !queuedMood) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      mood: queuedMood,
    }));
    setQueuedMood("");
  }, [isComposerOpen, queuedMood]);

  const categoryOptions = useMemo(() => {
    const categories = journals
      .map((entry) => entry.reflectionQuestion?.category)
      .filter(Boolean);
    return [...new Set([...reflectionCategories, ...categories])];
  }, [journals]);

  const sortedFilteredJournals = useMemo(() => {
    const list = journals.filter((entry) => {
      const entryDate = new Date(entry.date);
      const searchable = `${entry.title} ${entry.notes || ""} ${
        entry.highlights || ""
      } ${entry.reflectionQuestion?.text || ""}`.toLowerCase();

      const matchesSearch = searchQuery
        ? searchable.includes(searchQuery.toLowerCase())
        : true;
      const matchesMood =
        selectedMood === "all" ? true : entry.mood === selectedMood;
      const category = entry.reflectionQuestion?.category || "";
      const matchesCategory =
        selectedCategory === "all" ? true : category === selectedCategory;

      const afterStart = dateFrom
        ? entryDate >= new Date(`${dateFrom}T00:00:00`)
        : true;
      const beforeEnd = dateTo
        ? entryDate <= new Date(`${dateTo}T23:59:59`)
        : true;

      return (
        matchesSearch &&
        matchesMood &&
        matchesCategory &&
        afterStart &&
        beforeEnd
      );
    });

    if (sortBy === "oldest") {
      return list.sort(
        (left, right) => new Date(left.date) - new Date(right.date),
      );
    }

    if (sortBy === "mood") {
      return list.sort((left, right) => {
        const leftLabel = moodConfig[left.mood]?.label || left.mood || "";
        const rightLabel = moodConfig[right.mood]?.label || right.mood || "";
        return leftLabel.localeCompare(rightLabel);
      });
    }

    if (sortBy === "favorites") {
      return list.sort((left, right) => {
        const leftFav = favorites.includes(left._id) ? 1 : 0;
        const rightFav = favorites.includes(right._id) ? 1 : 0;
        if (leftFav !== rightFav) {
          return rightFav - leftFav;
        }
        return new Date(right.date) - new Date(left.date);
      });
    }

    return list.sort(
      (left, right) => new Date(right.date) - new Date(left.date),
    );
  }, [
    journals,
    searchQuery,
    selectedMood,
    selectedCategory,
    dateFrom,
    dateTo,
    sortBy,
    favorites,
  ]);

  const analytics = useMemo(() => {
    const totalEntries = journals.length;

    const moodCounts = journals.reduce((accumulator, entry) => {
      const mood = entry.mood || "neutral";
      accumulator[mood] = (accumulator[mood] || 0) + 1;
      return accumulator;
    }, {});

    const moodDistribution = Object.entries(moodCounts).map(
      ([mood, value]) => ({
        name: moodConfig[mood]?.label || mood,
        mood,
        value,
        color: moodConfig[mood]?.color || "#94a3b8",
      }),
    );

    const mostCommonMood = moodDistribution
      .slice()
      .sort((left, right) => right.value - left.value)[0]?.mood;

    const wordsPerEntry = journals.map((entry) =>
      getWordCount(entry.notes || ""),
    );
    const avgWords = wordsPerEntry.length
      ? Math.round(
          wordsPerEntry.reduce((sum, count) => sum + count, 0) /
            wordsPerEntry.length,
        )
      : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthCount = journals.filter(
      (entry) => new Date(entry.date) >= monthStart,
    ).length;
    const lastMonthCount = journals.filter((entry) => {
      const date = new Date(entry.date);
      return date >= lastMonthStart && date < monthStart;
    }).length;

    const growthPercent =
      lastMonthCount > 0
        ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
        : thisMonthCount > 0
          ? 100
          : 0;

    const uniqueDays = [
      ...new Set(
        journals
          .map((entry) => new Date(entry.date))
          .map((date) => date.toISOString().slice(0, 10)),
      ),
    ].sort((left, right) => new Date(right) - new Date(left));

    let currentStreak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (uniqueDays.includes(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const sparkline = Array.from({ length: 10 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (9 - index));
      const stamp = date.toISOString().slice(0, 10);
      const count = journals.filter(
        (entry) => new Date(entry.date).toISOString().slice(0, 10) === stamp,
      ).length;
      return {
        day: stamp.slice(5),
        count,
      };
    });

    const heatmapDays = Array.from({ length: 56 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (55 - index));
      const stamp = date.toISOString().slice(0, 10);
      const count = journals.filter(
        (entry) => new Date(entry.date).toISOString().slice(0, 10) === stamp,
      ).length;
      return {
        key: stamp,
        count,
      };
    });

    const latestEntryDate = journals.length
      ? new Date(
          journals
            .slice()
            .sort(
              (left, right) => new Date(right.date) - new Date(left.date),
            )[0].date,
        )
      : null;

    const moodTrendScore = journals.slice(0, 7).reduce((sum, entry) => {
      const score = moodConfig[entry.mood]?.score || 3;
      return sum + score;
    }, 0);

    const moodTrendLabel =
      moodTrendScore >= 30
        ? "Momentum is strong"
        : moodTrendScore >= 22
          ? "Balanced emotional rhythm"
          : "Take time to recharge";

    return {
      totalEntries,
      currentStreak,
      thisMonthCount,
      growthPercent,
      mostCommonMood,
      moodDistribution,
      avgWords,
      sparkline,
      heatmapDays,
      latestEntryDate,
      moodTrendLabel,
    };
  }, [journals]);

  const assistantInsights = useMemo(() => {
    const commonMood = analytics.mostCommonMood;
    const moodLabel = commonMood ? moodConfig[commonMood]?.label : "Neutral";

    const suggestQuestions = [
      "What challenge pushed me to grow today?",
      "Which moment made me feel most aligned with my goals?",
      "What one action can improve tomorrow by 1%?",
    ];

    const summaryText = formData.notes.trim()
      ? formData.notes
          .trim()
          .split(/(?<=[.!?])\s+/)
          .slice(0, 2)
          .join(" ")
      : "Write a few lines to generate a concise summary.";

    const nextActions =
      commonMood === "stressed" || commonMood === "anxious"
        ? [
            "Block 20 minutes for a calm reset walk.",
            "Write three wins before ending the day.",
            "Reduce tomorrow's top priorities to two.",
          ]
        : [
            "Plan your first focused task for tomorrow.",
            "Capture one gratitude note before sleep.",
            "Review weekly goals and celebrate progress.",
          ];

    return {
      moodLabel,
      suggestQuestions,
      summaryText,
      nextActions,
    };
  }, [analytics.mostCommonMood, formData.notes]);

  const currentWordCount = useMemo(
    () => getWordCount(formData.notes),
    [formData.notes],
  );
  const currentReadingTime = useMemo(
    () => getReadingMinutes(currentWordCount),
    [currentWordCount],
  );

  const fetchJournals = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/journal");
      setJournals(Array.isArray(data.data || data) ? data.data || data : []);
    } catch (requestError) {
      setError("Unable to load journal entries right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomReflectionQuestion = async () => {
    try {
      setReflectionLoading(true);
      setReflectionError("");
      const { data } = await API.get("/journal/questions/random");
      setReflectionQuestion(data.question || null);
      if (data.question?.category) {
        setSelectedReflectionCategory(data.question.category);
      }
    } catch {
      setReflectionError("Unable to load reflection question right now.");
      setReflectionQuestion(null);
    } finally {
      setReflectionLoading(false);
    }
  };

  const clearComposer = () => {
    setEditingJournalId("");
    setFormData(defaultFormData);
    setHighlightInput("");
    setReflectionQuestion(null);
    setReflectionError("");
    setDraftStatus("Draft idle");
    localStorage.removeItem(draftStorageKey);
  };

  const openCreateComposer = () => {
    setEditingJournalId("");

    const cachedDraft = localStorage.getItem(draftStorageKey);
    if (cachedDraft) {
      try {
        const parsed = JSON.parse(cachedDraft);
        setFormData({
          ...defaultFormData,
          ...parsed,
          highlights: normalizeHighlights(parsed.highlights),
        });

        setReflectionQuestion(parsed.reflectionQuestion || null);

        if (parsed.selectedReflectionCategory) {
          setSelectedReflectionCategory(parsed.selectedReflectionCategory);
        }

        setDraftStatus(
          parsed.savedAt
            ? `Restored draft from ${new Date(parsed.savedAt).toLocaleTimeString()}`
            : "Draft restored",
        );
      } catch {
        localStorage.removeItem(draftStorageKey);
      }
    } else {
      clearComposer();
    }

    setIsComposerOpen(true);
    fetchRandomReflectionQuestion();
  };

  const openEditComposer = (entry) => {
    setEditingJournalId(entry._id);
    setFormData({
      title: entry.title || "",
      mood: entry.mood || "neutral",
      activities: Array.isArray(entry.activities) ? entry.activities : [],
      highlights: normalizeHighlights(entry.highlights),
      notes: entry.notes || "",
    });
    setReflectionQuestion(entry.reflectionQuestion || null);
    setSelectedReflectionCategory(
      entry.reflectionQuestion?.category || reflectionCategories[0],
    );
    setDraftStatus("Editing existing entry");
    setIsComposerOpen(true);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setSaveSuccess(false);
  };

  const appendQuestionToNotes = () => {
    if (!reflectionQuestion?.text) {
      return;
    }

    setFormData((previous) => {
      const separator = previous.notes.trim() ? "\n\n" : "";
      return {
        ...previous,
        notes: `${previous.notes}${separator}Q: ${reflectionQuestion.text}\nA: `,
      };
    });
  };

  const handleAddHighlight = () => {
    const value = highlightInput.trim();
    if (!value || formData.highlights.includes(value)) {
      setHighlightInput("");
      return;
    }

    setFormData((previous) => ({
      ...previous,
      highlights: [...previous.highlights, value],
    }));
    setHighlightInput("");
  };

  const removeHighlight = (highlightToRemove) => {
    setFormData((previous) => ({
      ...previous,
      highlights: previous.highlights.filter(
        (item) => item !== highlightToRemove,
      ),
    }));
  };

  const toggleFavorite = (id) => {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/journal/${id}`);
      setFavorites((previous) => previous.filter((item) => item !== id));
      fetchJournals();
    } catch (requestError) {
      console.error("Error deleting journal:", requestError);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      return;
    }

    const payload = {
      ...formData,
      highlights: formData.highlights.join(", "),
      reflectionQuestion: reflectionQuestion
        ? {
            questionId:
              reflectionQuestion.questionId || reflectionQuestion.id || null,
            text: reflectionQuestion.text || "",
            category:
              selectedReflectionCategory || reflectionQuestion.category || "",
          }
        : undefined,
    };

    try {
      setIsSaving(true);

      if (editingJournalId) {
        await API.put(`/journal/${editingJournalId}`, payload);
      } else {
        await API.post("/journal", payload);
      }

      setSaveSuccess(true);
      clearComposer();
      await fetchJournals();

      window.setTimeout(() => {
        setIsComposerOpen(false);
        setSaveSuccess(false);
      }, 700);
    } catch (requestError) {
      console.error("Error saving journal:", requestError);
    } finally {
      setIsSaving(false);
    }
  };

  const insertMarkdown = (snippet) => {
    setFormData((previous) => ({
      ...previous,
      notes: `${previous.notes}${previous.notes ? "\n" : ""}${snippet}`,
    }));
  };

  const quickSetMoodToday = (mood) => {
    if (isComposerOpen) {
      setFormData((previous) => ({ ...previous, mood }));
      return;
    }

    setQueuedMood(mood);
    openCreateComposer();
  };

  const resetFilters = () => {
    setSelectedMood("all");
    setSelectedCategory("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("latest");
    setSearchQuery("");
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={pageClass}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={`${surfaceClass} overflow-hidden p-5 md:p-7`}>
          <div className="absolute" aria-hidden="true" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-100">
                <Sparkles size={14} /> LifeOS Reflection Engine
              </p>
              <h1 className="bg-gradient-to-r from-slate-900 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-cyan-200 md:text-4xl">
                My Journal
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
                Reflect, learn, and grow through daily self-awareness.
              </p>
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/35 bg-orange-500/10 px-3 py-1 font-medium text-orange-700 dark:text-orange-200">
                  <Flame size={14} /> {analytics.currentStreak} day streak
                </span>
                <button
                  type="button"
                  onClick={() =>
                    quickSetMoodToday(analytics.mostCommonMood || "neutral")
                  }
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium transition hover:brightness-105 ${focusRingClass} border-cyan-300/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200`}
                  aria-label="Set today's mood and open composer"
                >
                  {moodConfig[analytics.mostCommonMood || "neutral"]?.emoji ||
                    "🙂"}{" "}
                  Feeling{" "}
                  {moodConfig[analytics.mostCommonMood || "neutral"]?.label ||
                    "Neutral"}{" "}
                  Today
                </button>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/50 bg-slate-500/10 px-3 py-1 font-medium text-slate-600 dark:text-slate-200">
                  <CalendarDays size={14} />
                  {analytics.latestEntryDate
                    ? `Last entry ${analytics.latestEntryDate.toLocaleString()}`
                    : "No entries yet"}
                </span>
              </div>
            </div>

            <div className="flex items-start lg:justify-end">
              <button
                type="button"
                onClick={openCreateComposer}
                className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:shadow-cyan-500/35 ${focusRingClass}`}
                aria-label="Create a new journal entry"
              >
                <Plus size={16} /> Write Reflection
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.02 }}
            className={`${surfaceClass} p-4`}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
              Total Entries
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {analytics.totalEntries}
              </p>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  analytics.growthPercent >= 0
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-200"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-200"
                }`}
              >
                {analytics.growthPercent >= 0 ? "+" : ""}
                {analytics.growthPercent}%
              </span>
            </div>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.sparkline}>
                  <defs>
                    <linearGradient
                      id="journalSparkline"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                      <stop
                        offset="100%"
                        stopColor="#06b6d4"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    formatter={(value) => [`${value} entries`, "Count"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(148, 163, 184, 0.3)",
                    }}
                  />
                  <Area
                    dataKey="count"
                    type="monotone"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#journalSparkline)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.article>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className={`${surfaceClass} p-4`}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
              Mood Distribution
            </p>
            <div className="mt-2 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.moodDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={26}
                    outerRadius={44}
                    paddingAngle={2}
                  >
                    {analytics.moodDistribution.map((entry) => (
                      <Cell key={entry.mood} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _, payload) => [
                      `${value} entries`,
                      payload?.payload?.name || "Mood",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {analytics.mostCommonMood
                ? `${moodConfig[analytics.mostCommonMood]?.emoji} ${
                    moodConfig[analytics.mostCommonMood]?.label
                  } appears most often`
                : "No mood records yet"}
            </p>
          </motion.article>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className={`${surfaceClass} p-4`}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
              Consistency Map
            </p>
            <div className="mt-3 grid grid-cols-14 gap-1">
              {analytics.heatmapDays.map((day) => {
                const level =
                  day.count >= 3
                    ? "bg-cyan-500"
                    : day.count === 2
                      ? "bg-cyan-400/90"
                      : day.count === 1
                        ? "bg-cyan-300/70"
                        : "bg-slate-300/40 dark:bg-slate-600/40";
                return (
                  <span
                    key={day.key}
                    className={`h-3 w-3 rounded-sm ${level}`}
                    title={`${day.key}: ${day.count} entries`}
                    aria-label={`${day.key} has ${day.count} entries`}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Past 8 weeks of reflection activity
            </p>
          </motion.article>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.11 }}
            className={`${surfaceClass} p-4`}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
              Reflection Depth
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {analytics.avgWords}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              average words per entry
            </p>
            <div className="mt-3 rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-2 text-xs text-cyan-700 dark:text-cyan-200">
              {analytics.moodTrendLabel}
            </div>
          </motion.article>
        </section>

        <section className={`${surfaceClass} p-4 md:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Journal Timeline
            </h2>
            <button
              type="button"
              onClick={() => setFiltersCollapsed((previous) => !previous)}
              className={`rounded-lg border border-slate-300/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200 md:hidden ${focusRingClass}`}
              aria-label="Toggle filter panel"
            >
              Filters
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search journal entries"
                className={`w-full rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                aria-label="Search journal entries"
              />
            </div>

            <div
              className={`${filtersCollapsed ? "hidden" : "grid"} grid-cols-1 gap-2 md:grid md:grid-cols-5`}
            >
              <div className="relative">
                <select
                  value={selectedMood}
                  onChange={(event) => setSelectedMood(event.target.value)}
                  className={`w-full appearance-none rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                  aria-label="Filter by mood"
                >
                  <option value="all">All moods</option>
                  {Object.entries(moodConfig).map(([value, mood]) => (
                    <option key={value} value={value}>
                      {mood.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className={`w-full appearance-none rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className={`rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                aria-label="Filter from date"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className={`rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                aria-label="Filter to date"
              />

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className={`w-full appearance-none rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                  aria-label="Sort entries"
                >
                  <option value="latest">Sort: Latest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="mood">Sort: Mood</option>
                  <option value="favorites">Sort: Favorites</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className={`rounded-lg border border-slate-300/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 ${focusRingClass}`}
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="rounded-xl border border-slate-300/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 p-6 text-center text-slate-600 dark:text-slate-200">
                Loading entries...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-300/40 bg-rose-500/10 p-6 text-center text-rose-700 dark:text-rose-200">
                {error}
              </div>
            ) : journals.length === 0 ? (
              <motion.div
                initial={
                  shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }
                }
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-dashed border-cyan-300/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center md:p-12"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-100">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Your story starts here
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                  Every reflection helps you understand yourself better.
                </p>
                <button
                  type="button"
                  onClick={openCreateComposer}
                  className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white ${focusRingClass}`}
                >
                  <Plus size={16} /> Write First Entry
                </button>
              </motion.div>
            ) : sortedFilteredJournals.length === 0 ? (
              <div className="rounded-xl border border-slate-300/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 p-6 text-center text-slate-600 dark:text-slate-200">
                No entries match your current filters.
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {sortedFilteredJournals.map((entry, index) => {
                    const mood = moodConfig[entry.mood] || moodConfig.neutral;
                    const highlights = normalizeHighlights(entry.highlights);
                    const preview = (entry.notes || "").slice(0, 200);
                    const isActive = activeEntryId === entry._id;
                    const isFavorite = favorites.includes(entry._id);

                    return (
                      <motion.article
                        key={entry._id}
                        initial={
                          shouldReduceMotion ? false : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -8 }
                        }
                        transition={{
                          duration: 0.2,
                          delay: shouldReduceMotion ? 0 : index * 0.025,
                        }}
                        className={`${surfaceClass} border-l-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl ${
                          isFavorite
                            ? "border-l-amber-400"
                            : "border-l-cyan-400/50"
                        }`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {new Date(entry.date).toLocaleDateString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                                <span
                                  className="rounded-full px-2 py-1 font-semibold"
                                  style={{
                                    backgroundColor: `${mood.color}22`,
                                    color: mood.color,
                                  }}
                                >
                                  {mood.emoji} {mood.label}
                                </span>
                                {entry.reflectionQuestion?.category && (
                                  <span className="rounded-full border border-slate-300/50 dark:border-white/10 px-2 py-1">
                                    {entry.reflectionQuestion.category}
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                                {entry.title}
                              </h3>
                            </div>
                          </div>

                          {entry.reflectionQuestion?.text && (
                            <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">
                                Reflection Question
                              </p>
                              <p className="mt-1 text-sm text-slate-700 dark:text-slate-100">
                                {entry.reflectionQuestion.text}
                              </p>
                            </div>
                          )}

                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                            {preview}
                            {entry.notes?.length > 200 ? "..." : ""}
                          </p>

                          {highlights.length > 0 && (
                            <div>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                                Highlights
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {highlights.map((item) => (
                                  <span
                                    key={`${entry._id}-${item}`}
                                    className="rounded-full border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-100"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {isActive && (
                            <div className="rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-3 text-sm text-slate-700 dark:text-slate-100">
                              <p className="whitespace-pre-wrap">
                                {entry.notes}
                              </p>
                            </div>
                          )}

                          <div className="overflow-x-auto">
                            <div className="flex min-w-max items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveEntryId((current) =>
                                    current === entry._id ? "" : entry._id,
                                  )
                                }
                                className={`rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-100 transition hover:bg-cyan-500/10 ${focusRingClass}`}
                                aria-label={`${isActive ? "Close" : "Open"} entry`}
                              >
                                Open
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditComposer(entry)}
                                className={`inline-flex items-center gap-1 rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-100 transition hover:bg-cyan-500/10 ${focusRingClass}`}
                                aria-label="Edit entry"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleFavorite(entry._id)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${focusRingClass} ${
                                  isFavorite
                                    ? "border-amber-300/60 bg-amber-500/20 text-amber-700 dark:text-amber-200"
                                    : "border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-100 hover:bg-amber-500/10"
                                }`}
                                aria-label="Favorite entry"
                              >
                                <Star size={12} /> Favorite
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry._id)}
                                className={`inline-flex items-center gap-1 rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-200 transition hover:bg-rose-500/20 ${focusRingClass}`}
                                aria-label="Delete entry"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isComposerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm"
          >
            <div className="flex h-full items-center justify-center p-0 md:p-4">
              <motion.section
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, y: 12, scale: 0.99 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.22 }}
                className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none border-0 bg-white dark:bg-slate-900 md:h-[94vh] md:rounded-3xl md:border md:border-white/10"
                aria-modal="true"
                role="dialog"
                aria-label="Journal composer"
              >
                <header className="border-b border-slate-200 dark:border-white/10 px-5 py-4 md:px-8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {editingJournalId
                          ? "Edit Journal Entry"
                          : "New Journal Entry"}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Distraction-free writing space for intentional
                        reflection.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeComposer}
                      className={`rounded-lg border border-slate-300/50 dark:border-white/10 bg-white dark:bg-white/5 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 ${focusRingClass}`}
                      aria-label="Close composer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-5 md:px-8">
                  <div className="space-y-6">
                    <section className="rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 md:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-200">
                            <Sparkles size={13} /> Step 1: Reflection Prompt
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              Category
                            </span>
                            <div className="relative">
                              <select
                                value={selectedReflectionCategory}
                                onChange={(event) =>
                                  setSelectedReflectionCategory(
                                    event.target.value,
                                  )
                                }
                                className={`appearance-none rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5 pr-8 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                                aria-label="Reflection category"
                              >
                                {categoryOptions.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={fetchRandomReflectionQuestion}
                          disabled={reflectionLoading}
                          className={`inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-60 ${focusRingClass}`}
                          aria-label="Generate a new reflection question"
                        >
                          {reflectionLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Wand2 size={14} />
                          )}
                          Generate New Question
                        </button>
                      </div>

                      {reflectionError ? (
                        <p className="mt-3 text-sm text-rose-600 dark:text-rose-200">
                          {reflectionError}
                        </p>
                      ) : (
                        <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">
                          "
                          {reflectionQuestion?.text ||
                            "Loading reflection prompt..."}
                          "
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={appendQuestionToNotes}
                        disabled={!reflectionQuestion?.text}
                        className={`mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-white/80 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-60 ${focusRingClass}`}
                        aria-label="Insert question into notes"
                      >
                        <MessageCircle size={13} /> Use Question
                      </button>
                    </section>

                    <section className="space-y-5">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">
                        <BookOpen size={13} /> Step 2: Writing Area
                      </p>

                      <div className="relative">
                        <input
                          id="journal-title"
                          type="text"
                          value={formData.title}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              title: event.target.value,
                            }))
                          }
                          placeholder=" "
                          className={`peer w-full rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 px-4 pb-2.5 pt-5 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                          aria-label="Journal title"
                        />
                        <label
                          htmlFor="journal-title"
                          className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-300 transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal"
                        >
                          Title *
                        </label>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          Mood
                        </p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {moodChoices.map((moodValue) => {
                            const mood = moodConfig[moodValue];
                            const isActive = formData.mood === moodValue;
                            return (
                              <motion.button
                                whileTap={
                                  shouldReduceMotion
                                    ? undefined
                                    : { scale: 0.98 }
                                }
                                key={moodValue}
                                type="button"
                                onClick={() =>
                                  setFormData((previous) => ({
                                    ...previous,
                                    mood: moodValue,
                                  }))
                                }
                                className={`rounded-xl border px-3 py-3 text-left transition ${focusRingClass} ${
                                  isActive
                                    ? "border-cyan-400 bg-cyan-500/15"
                                    : "border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-cyan-500/10"
                                }`}
                                aria-label={`Select mood ${mood.label}`}
                              >
                                <span
                                  className={`inline-block text-xl ${isActive ? "scale-110" : ""}`}
                                >
                                  {mood.emoji}
                                </span>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                  {mood.label}
                                </p>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          Highlights
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag
                              size={14}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                              type="text"
                              value={highlightInput}
                              onChange={(event) =>
                                setHighlightInput(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  handleAddHighlight();
                                }
                              }}
                              placeholder="Add a highlight"
                              className={`w-full rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 py-2.5 pl-8 pr-3 text-sm text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                              aria-label="Add highlight"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddHighlight}
                            className={`rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-3 text-sm font-semibold text-cyan-700 dark:text-cyan-100 hover:bg-cyan-500/25 ${focusRingClass}`}
                          >
                            Add
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.highlights.map((highlight) => (
                            <button
                              key={highlight}
                              type="button"
                              onClick={() => removeHighlight(highlight)}
                              className={`inline-flex items-center gap-1 rounded-full border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 ${focusRingClass}`}
                              aria-label={`Remove highlight ${highlight}`}
                            >
                              {highlight}
                              <X size={12} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Reflection
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span>{draftStatus}</span>
                            <span>{currentWordCount} words</span>
                            <span>{currentReadingTime} min read</span>
                          </div>
                        </div>

                        <div className="mb-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => insertMarkdown("- New insight")}
                            className={`rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-100 ${focusRingClass}`}
                          >
                            Bullet List
                          </button>
                          <button
                            type="button"
                            onClick={() => insertMarkdown("## Key takeaway")}
                            className={`rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-100 ${focusRingClass}`}
                          >
                            Heading
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              insertMarkdown(
                                "### AI Writing Assistance\n- What happened today?\n- How did it make me feel?\n- What should I improve tomorrow?",
                              )
                            }
                            className={`inline-flex items-center gap-1 rounded-lg border border-fuchsia-300/50 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-200 ${focusRingClass}`}
                          >
                            <Wand2 size={12} /> AI Assist
                          </button>
                        </div>

                        <textarea
                          id="journal-notes"
                          value={formData.notes}
                          onChange={(event) =>
                            setFormData((previous) => ({
                              ...previous,
                              notes: event.target.value,
                            }))
                          }
                          rows={11}
                          placeholder="Write about your thoughts, experiences, lessons, and feelings..."
                          className={`w-full rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 p-3 text-sm leading-relaxed text-slate-900 dark:text-slate-100 ${focusRingClass}`}
                          aria-label="Journal notes"
                        />
                      </div>
                    </section>
                  </div>
                </div>

                <footer className="sticky bottom-0 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 px-5 py-4 md:px-8">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeComposer}
                      className={`rounded-xl border border-slate-300/50 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 ${focusRingClass}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSaving || !formData.title.trim()}
                      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                          Saving...
                        </>
                      ) : (
                        "Submit Entry"
                      )}
                    </button>
                  </div>
                </footer>

                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="pointer-events-none absolute inset-x-0 bottom-20 mx-auto w-fit rounded-full border border-emerald-300/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
                    >
                      Reflection saved successfully
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={openCreateComposer}
        className={`fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 md:hidden ${focusRingClass}`}
        aria-label="Create new journal entry"
      >
        <Plus size={16} /> New Entry
      </button>

      <button
        type="button"
        onClick={() => setIsAssistantOpen((previous) => !previous)}
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/30 ${focusRingClass}`}
        aria-label="Open Journal Assistant"
      >
        <Sparkles size={18} />
      </button>

      <AnimatePresence>
        {isAssistantOpen && (
          <motion.aside
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`${surfaceClass} fixed bottom-20 right-4 z-50 w-[92vw] max-w-sm p-4`}
            aria-label="Journal Assistant panel"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Journal Assistant
              </h3>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className={`rounded-md border border-slate-300/50 dark:border-white/10 p-1 text-slate-700 dark:text-slate-200 ${focusRingClass}`}
                aria-label="Close assistant"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-cyan-700 dark:text-cyan-200">
                  Suggest Reflection Question
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-100">
                  {assistantInsights.suggestQuestions[0]}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    insertMarkdown(
                      `Q: ${assistantInsights.suggestQuestions[0]}\nA:`,
                    )
                  }
                  className={`mt-2 text-xs font-semibold text-cyan-700 underline dark:text-cyan-200 ${focusRingClass}`}
                >
                  Insert into draft
                </button>
              </div>

              <div className="rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-600 dark:text-slate-300">
                  Summarize Entry
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-100">
                  {assistantInsights.summaryText}
                </p>
              </div>

              <div className="rounded-lg border border-slate-300/50 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-600 dark:text-slate-300">
                  Emotional Pattern
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-100">
                  Recent trend leans toward {assistantInsights.moodLabel}.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-emerald-700 dark:text-emerald-200">
                  Suggested Next Actions
                </p>
                <ul className="mt-1 list-disc pl-4 text-slate-700 dark:text-slate-100">
                  {assistantInsights.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Journal;
