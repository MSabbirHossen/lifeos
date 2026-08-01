import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/api";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Flame,
  Loader2,
  Plus,
  Search,
  Sparkles,
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
  happy: {
    label: "Happy",
    emoji: "😀",
    color:
      "border-emerald-300/60 bg-emerald-500/15 text-emerald-100 dark:text-emerald-100",
  },
  neutral: {
    label: "Neutral",
    emoji: "😐",
    color:
      "border-slate-300/60 bg-slate-500/15 text-slate-100 dark:text-slate-100",
  },
  sad: {
    label: "Sad",
    emoji: "😔",
    color: "border-sky-300/60 bg-sky-500/15 text-sky-100 dark:text-sky-100",
  },
  motivated: {
    label: "Motivated",
    emoji: "🔥",
    color:
      "border-orange-300/60 bg-orange-500/15 text-orange-100 dark:text-orange-100",
  },
  stressed: {
    label: "Stressed",
    emoji: "😰",
    color: "border-rose-300/60 bg-rose-500/15 text-rose-100 dark:text-rose-100",
  },
  grateful: {
    label: "Grateful",
    emoji: "🙏",
    color:
      "border-indigo-300/60 bg-indigo-500/15 text-indigo-100 dark:text-indigo-100",
  },
  excited: {
    label: "Excited",
    emoji: "✨",
    color:
      "border-yellow-300/60 bg-yellow-500/15 text-yellow-100 dark:text-yellow-100",
  },
  anxious: {
    label: "Anxious",
    emoji: "🌫️",
    color: "border-fuchsia-300/60 bg-fuchsia-500/15 text-fuchsia-100",
  },
  calm: {
    label: "Calm",
    emoji: "🕊️",
    color: "border-cyan-300/60 bg-cyan-500/15 text-cyan-100",
  },
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

const draftStorageKey = "lifeos-journal-draft-v2";

const glassCardClass =
  "rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-[0_18px_45px_-22px_rgba(0,0,0,0.55)] backdrop-blur-xl";

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState("");
  const [reflectionQuestion, setReflectionQuestion] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [highlightInput, setHighlightInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [isSaving, setIsSaving] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState("");
  const [draftStatus, setDraftStatus] = useState("Draft idle");
  const [selectedReflectionCategory, setSelectedReflectionCategory] = useState(
    reflectionCategories[0],
  );

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
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
          selectedReflectionCategory,
          savedAt: new Date().toISOString(),
        }),
      );
      setDraftStatus(`Autosaved at ${new Date().toLocaleTimeString()}`);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [formData, isModalOpen, selectedReflectionCategory]);

  const categoryOptions = useMemo(() => {
    const categories = journals
      .map((entry) => entry.reflectionQuestion?.category)
      .filter(Boolean);
    return [...new Set([...reflectionCategories, ...categories])];
  }, [journals]);

  const sortedFilteredJournals = useMemo(() => {
    const list = journals.filter((entry) => {
      const entryDate = new Date(entry.date);
      const searchBucket = `${entry.title} ${entry.notes || ""} ${
        entry.highlights || ""
      } ${entry.reflectionQuestion?.text || ""}`.toLowerCase();

      const matchesSearch = searchQuery
        ? searchBucket.includes(searchQuery.toLowerCase())
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
      return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    if (sortBy === "mood") {
      return list.sort((a, b) =>
        (moodConfig[a.mood]?.label || a.mood).localeCompare(
          moodConfig[b.mood]?.label || b.mood,
        ),
      );
    }

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    journals,
    searchQuery,
    selectedMood,
    selectedCategory,
    dateFrom,
    dateTo,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const totalEntries = journals.length;

    const moodCounts = journals.reduce((accumulator, entry) => {
      const mood = entry.mood || "neutral";
      accumulator[mood] = (accumulator[mood] || 0) + 1;
      return accumulator;
    }, {});

    const mostCommonMood = Object.entries(moodCounts).sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0];

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = journals.filter(
      (entry) => new Date(entry.date) >= monthStart,
    ).length;

    const uniqueDays = [
      ...new Set(
        journals
          .map((entry) => new Date(entry.date))
          .map((date) => date.toISOString().slice(0, 10)),
      ),
    ].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (uniqueDays.includes(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      totalEntries,
      currentStreak: streak,
      mostCommonMood,
      thisMonthCount,
    };
  }, [journals]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/journal");
      setJournals(data.data || data);
    } catch (error) {
      setError("Unable to load journal entries right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        highlights: formData.highlights.join(", "),
        reflectionQuestion: reflectionQuestion
          ? {
              questionId: reflectionQuestion.id,
              text: reflectionQuestion.text,
              category: reflectionQuestion.category,
            }
          : undefined,
      };

      await API.post("/journal", payload);
      setFormData(defaultFormData);
      setHighlightInput("");
      setReflectionQuestion(null);
      setReflectionError("");
      setIsModalOpen(false);
      setDraftStatus("Draft idle");
      localStorage.removeItem(draftStorageKey);
      fetchJournals();
    } catch (error) {
      console.error("Error creating journal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRandomReflectionQuestion = async () => {
    try {
      setReflectionLoading(true);
      setReflectionError("");
      const { data } = await API.get("/journal/questions/random");
      setReflectionQuestion(data.question);
    } catch (questionError) {
      setReflectionError("Unable to load reflection question right now.");
      setReflectionQuestion(null);
    } finally {
      setReflectionLoading(false);
    }
  };

  const openCreateModal = () => {
    const cachedDraft = localStorage.getItem(draftStorageKey);
    if (cachedDraft) {
      try {
        const parsedDraft = JSON.parse(cachedDraft);
        setFormData({
          ...defaultFormData,
          ...parsedDraft,
          highlights: Array.isArray(parsedDraft.highlights)
            ? parsedDraft.highlights
            : [],
        });
        if (parsedDraft.selectedReflectionCategory) {
          setSelectedReflectionCategory(parsedDraft.selectedReflectionCategory);
        }
        setDraftStatus(
          parsedDraft.savedAt
            ? `Restored draft from ${new Date(
                parsedDraft.savedAt,
              ).toLocaleTimeString()}`
            : "Draft restored",
        );
      } catch (draftError) {
        localStorage.removeItem(draftStorageKey);
      }
    }

    setIsModalOpen(true);
    fetchRandomReflectionQuestion();
  };

  const appendQuestionToNotes = () => {
    if (!reflectionQuestion?.text) {
      return;
    }

    setFormData((prev) => {
      const separator = prev.notes.trim().length > 0 ? "\n\n" : "";
      return {
        ...prev,
        notes: `${prev.notes}${separator}Q: ${reflectionQuestion.text}\nA: `,
      };
    });
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/journal/${id}`);
      fetchJournals();
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
  };

  const handleAddHighlight = () => {
    const value = highlightInput.trim();
    if (!value) {
      return;
    }

    if (formData.highlights.includes(value)) {
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
        (highlight) => highlight !== highlightToRemove,
      ),
    }));
  };

  const insertMarkdown = (snippet) => {
    setFormData((previous) => ({
      ...previous,
      notes: `${previous.notes}${previous.notes ? "\n" : ""}${snippet}`,
    }));
  };

  const injectAIAssistPrompt = () => {
    insertMarkdown(
      "### AI Writing Assistance\n- What happened today?\n- How did it make me feel?\n- What is one lesson I can carry into tomorrow?",
    );
  };

  return (
    <div className="min-h-screen space-y-8 bg-[radial-gradient(circle_at_top,_rgba(74,144,226,0.22),_transparent_45%),radial-gradient(circle_at_75%_20%,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_rgba(5,8,20,0.98),_rgba(9,12,28,1))] px-4 py-6 text-white md:px-8 md:py-8">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glassCardClass} p-6 md:p-8`}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles size={14} /> Reflection Studio
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Journal
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/80 md:text-base">
              Capture your thoughts, reflect on your journey, and track your
              personal growth.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/30"
          >
            <Plus size={18} /> New Entry
          </button>
        </div>
      </motion.header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Entries",
            value: stats.totalEntries,
            icon: <BookOpen size={18} className="text-cyan-200" />,
          },
          {
            label: "Current Streak",
            value: `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`,
            icon: <Flame size={18} className="text-orange-200" />,
          },
          {
            label: "Most Common Mood",
            value: stats.mostCommonMood
              ? `${moodConfig[stats.mostCommonMood]?.emoji || "🙂"} ${
                  moodConfig[stats.mostCommonMood]?.label ||
                  stats.mostCommonMood
                }`
              : "-",
            icon: <Sparkles size={18} className="text-fuchsia-200" />,
          },
          {
            label: "This Month",
            value: `${stats.thisMonthCount} reflections`,
            icon: <CalendarDays size={18} className="text-emerald-200" />,
          },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`${glassCardClass} p-5 transition-transform duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300/80">
                {item.label}
              </p>
              {item.icon}
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {item.value}
            </p>
          </motion.div>
        ))}
      </section>

      <section className={`${glassCardClass} space-y-4 p-4 md:p-6`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-semibold">Reflection Timeline</h2>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <div className="relative w-full lg:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search entries"
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMood("all");
                setSelectedCategory("all");
                setDateFrom("");
                setDateTo("");
                setSortBy("latest");
                setSearchQuery("");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 hover:bg-white/10"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <select
              value={selectedMood}
              onChange={(event) => setSelectedMood(event.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
            >
              <option value="all">All moods</option>
              {Object.entries(moodConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
          />

          <div className="relative">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
            >
              <option value="latest">Sort: Latest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="mood">Sort: Mood</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 text-center text-slate-300">
            Loading entries...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-6 text-center text-rose-200">
            {error}
          </div>
        ) : journals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-dashed border-cyan-200/30 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 p-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <BookOpen size={30} className="text-cyan-100" />
            </div>
            <h3 className="text-2xl font-semibold">
              Start your reflection journey
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300/85">
              Your thoughts, lessons, and memories will appear here.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 font-semibold text-slate-950"
            >
              <Plus size={16} /> Create First Entry
            </button>
          </motion.div>
        ) : sortedFilteredJournals.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-slate-300">
            No entries match your current filters.
          </div>
        ) : (
          <div className="relative space-y-4">
            <div className="absolute left-5 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-400/50 to-transparent md:block" />
            <AnimatePresence>
              {sortedFilteredJournals.map((journal, index) => {
                const mood = moodConfig[journal.mood] || moodConfig.neutral;
                const previewText = (journal.notes || "").slice(0, 180);
                const highlights = (journal.highlights || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean);

                return (
                  <motion.article
                    key={journal._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative md:pl-10"
                  >
                    <div className="absolute left-[14px] top-8 hidden h-3 w-3 rounded-full border border-cyan-200 bg-cyan-300 shadow md:block" />
                    <div
                      className={`${glassCardClass} p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/30`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200/80">
                            <span className="font-semibold text-white">
                              {new Date(journal.date).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${mood.color}`}
                            >
                              <span>{mood.emoji}</span>
                              <span>{mood.label}</span>
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-white">
                            {journal.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-200/80">
                            "{previewText}
                            {journal.notes?.length > 180 ? "..." : ""}"
                          </p>

                          {highlights.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/80">
                                Highlights
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {highlights.map((item) => (
                                  <span
                                    key={`${journal._id}-${item}`}
                                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-100"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeEntryId === journal._id && (
                            <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-slate-100">
                              {journal.reflectionQuestion?.text && (
                                <p className="mb-2 text-cyan-100">
                                  Reflection: {journal.reflectionQuestion.text}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap">
                                {journal.notes}
                              </p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActiveEntryId((current) =>
                                current === journal._id ? "" : journal._id,
                              )
                            }
                            className="text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
                          >
                            {activeEntryId === journal._id
                              ? "Hide Entry"
                              : "View Entry"}{" "}
                            →
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(journal._id)}
                          className="self-start rounded-lg border border-rose-300/20 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20"
                          title="Delete entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-3 pb-3 pt-8 backdrop-blur-md md:items-center md:px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl"
            >
              <div className="border-b border-white/10 px-5 py-4 md:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      New Journal Entry
                    </h2>
                    <p className="mt-1 text-sm text-slate-300/80">
                      Take a few moments to reflect on your day.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 md:px-8 md:py-6">
                <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-slate-900/70 p-4 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/90">
                        Today&apos;s Reflection
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-100">
                          Category
                        </span>
                        <div className="relative">
                          <select
                            value={selectedReflectionCategory}
                            onChange={(event) =>
                              setSelectedReflectionCategory(event.target.value)
                            }
                            className="appearance-none rounded-lg border border-white/15 bg-slate-900/70 px-3 py-1.5 pr-8 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
                          >
                            {categoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={fetchRandomReflectionQuestion}
                      disabled={reflectionLoading}
                      className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100 transition hover:bg-white/15 disabled:opacity-60"
                    >
                      {reflectionLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      New Question
                    </button>
                  </div>

                  {reflectionError ? (
                    <p className="mt-3 text-sm text-rose-200">
                      {reflectionError}
                    </p>
                  ) : (
                    <p className="mt-4 text-lg font-medium text-white">
                      "
                      {reflectionQuestion?.text ||
                        "Loading reflection prompt..."}
                      "
                    </p>
                  )}

                  <p className="mt-2 text-sm text-slate-200/80">
                    Take a few minutes and answer honestly.
                  </p>

                  <button
                    type="button"
                    onClick={appendQuestionToNotes}
                    disabled={!reflectionQuestion?.text}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-55"
                  >
                    <Wand2 size={14} /> Insert Question Into Notes
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <input
                      id="journal-title"
                      type="text"
                      value={formData.title}
                      onChange={(event) =>
                        setFormData({ ...formData, title: event.target.value })
                      }
                      placeholder=" "
                      className="peer w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 pb-2.5 pt-5 text-sm text-white outline-none transition focus:border-cyan-300/60"
                    />
                    <label
                      htmlFor="journal-title"
                      className="pointer-events-none absolute left-4 top-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/80 transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-slate-300"
                    >
                      Title *
                    </label>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-100">
                      Mood
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {moodChoices.map((moodValue) => {
                        const mood = moodConfig[moodValue];
                        const isActive = formData.mood === moodValue;
                        return (
                          <button
                            key={moodValue}
                            type="button"
                            onClick={() =>
                              setFormData((previous) => ({
                                ...previous,
                                mood: moodValue,
                              }))
                            }
                            className={`group rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                              isActive
                                ? "border-cyan-300 bg-cyan-400/20 shadow-lg shadow-cyan-500/20"
                                : "border-white/10 bg-white/5 hover:border-cyan-300/40 hover:bg-white/10"
                            }`}
                          >
                            <span
                              className={`inline-block text-xl transition-transform duration-200 ${
                                isActive ? "scale-110" : "group-hover:scale-105"
                              }`}
                            >
                              {mood.emoji}
                            </span>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {mood.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-100">
                      Highlights
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag
                          size={14}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                          className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-8 pr-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="rounded-xl border border-cyan-300/35 bg-cyan-400/15 px-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/25"
                      >
                        Add
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.highlights.map((highlight) => (
                        <button
                          key={highlight}
                          type="button"
                          onClick={() => removeHighlight(highlight)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-100 hover:bg-white/10"
                        >
                          {highlight}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">
                        Notes
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span>{draftStatus}</span>
                        <span>{formData.notes.length} chars</span>
                      </div>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertMarkdown("- New insight")}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-100 hover:bg-white/10"
                      >
                        Bullet List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown("## Key takeaway")}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-100 hover:bg-white/10"
                      >
                        Heading
                      </button>
                      <button
                        type="button"
                        onClick={injectAIAssistPrompt}
                        className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-300/35 bg-fuchsia-400/15 px-2.5 py-1 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-400/25"
                      >
                        <Wand2 size={12} /> AI Assist
                      </button>
                    </div>

                    <textarea
                      id="journal-notes"
                      value={formData.notes}
                      onChange={(event) =>
                        setFormData({ ...formData, notes: event.target.value })
                      }
                      rows={9}
                      placeholder="Write about your thoughts, experiences, lessons, and feelings..."
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-auto border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur md:px-8">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving || !formData.title.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      "Submit Entry"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Journal;
