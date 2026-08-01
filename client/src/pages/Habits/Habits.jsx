import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import {
  Trash2,
  Plus,
  Check,
  PauseCircle,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CATEGORY_OPTIONS = [
  "Discipline",
  "Islamic",
  "Fitness",
  "Health",
  "Nutrition",
  "Productivity",
  "Education",
  "Learning",
  "Career",
  "Knowledge",
  "Digital Wellness",
  "Digital Discipline",
  "General",
];

const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Custom"];

const ICON_OPTIONS = [
  "✅",
  "🛏️",
  "🌄",
  "📖",
  "💪",
  "🥗",
  "📝",
  "🎓",
  "🕛",
  "😴",
  "🍽️",
  "🕒",
  "💼",
  "🕕",
  "📚",
  "🕗",
  "🥷",
  "🗣️",
  "💰",
  "📰",
  "🛌",
  "📱",
  "🚫",
  "❤️",
];

const CATEGORY_ICON = {
  Islamic: "🕌",
  Fitness: "💪",
  Learning: "📚",
  Career: "💼",
  Health: "❤️",
  "Digital Discipline": "📱",
};

const normalizeName = (value = "") => value.trim().toLowerCase();

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [allowCreateDifferent, setAllowCreateDifferent] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    habitName: "",
    category: "General",
    icon: "✅",
    frequency: "Daily",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    const query = formData.habitName.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSelectedSuggestion(null);
      setSuggestionMessage("");
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await API.get(
          `/habits/search?q=${encodeURIComponent(query)}`,
        );
        const matches = response?.data?.data || [];
        setSearchResults(matches);

        const exactMatch = matches.find(
          (item) => normalizeName(item.name) === normalizeName(query),
        );

        if (exactMatch) {
          setSelectedSuggestion(exactMatch);
          setSuggestionMessage(`${exactMatch.name} already exists`);
        } else {
          setSelectedSuggestion(null);
          setSuggestionMessage("");
        }
      } catch (error) {
        console.error("Error searching habits:", error);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.habitName, isModalOpen]);

  const fetchData = async () => {
    try {
      await API.post("/habits/initialize");

      const [habitRes, templateRes, statsRes] = await Promise.all([
        API.get("/habits"),
        API.get("/habits/templates"),
        API.get("/habits/stats"),
      ]);

      setHabits(Array.isArray(habitRes.data) ? habitRes.data : []);
      setTemplates(templateRes?.data?.data || []);
      setStats(statsRes?.data?.data || null);
    } catch (error) {
      console.error("Error fetching habit data:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      habitName: "",
      category: "General",
      icon: "✅",
      frequency: "Daily",
    });
    setSearchResults([]);
    setSuggestionMessage("");
    setAllowCreateDifferent(false);
    setSelectedSuggestion(null);
  };

  const useExistingHabit = async () => {
    if (!selectedSuggestion) {
      return;
    }

    try {
      if (selectedSuggestion.source === "user") {
        await API.patch(`/habits/${selectedSuggestion.id}`, { active: true });
        closeModal();
        fetchData();
        return;
      }

      await API.post("/habits", {
        habitTemplateId:
          selectedSuggestion.habitTemplateId || selectedSuggestion.id,
        habitName: selectedSuggestion.name,
      });
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error attaching existing habit:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const trimmedName = formData.habitName.trim();
      if (!trimmedName) {
        return;
      }

      const hasExactMatch = searchResults.some(
        (item) => normalizeName(item.name) === normalizeName(trimmedName),
      );

      if (hasExactMatch && !allowCreateDifferent) {
        setSuggestionMessage(`${trimmedName} already exists`);
        return;
      }

      const payload = {
        habitName: trimmedName,
        category: formData.category,
        icon: formData.icon,
        frequency: formData.frequency,
      };

      if (selectedSuggestion && !allowCreateDifferent) {
        payload.habitTemplateId =
          selectedSuggestion.habitTemplateId || selectedSuggestion.id;
      }

      await API.post("/habits", payload);
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleToggleComplete = async (id, completedToday) => {
    try {
      await API.post(`/habits/${id}/log`, { completed: !completedToday });
      fetchData();
    } catch (error) {
      console.error("Error logging habit:", error);
    }
  };

  const handleToggleActive = async (id, active) => {
    try {
      await API.patch(`/habits/${id}`, { active: !active });
      fetchData();
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/habits/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const activeHabits = habits.filter((habit) => habit.active);
  const inactiveHabits = habits.filter((habit) => !habit.active);

  const todaySummary = stats?.today || {
    completed: activeHabits.filter((habit) => habit.completedToday).length,
    total: activeHabits.length,
    percentage: activeHabits.length
      ? Math.round(
          (activeHabits.filter((habit) => habit.completedToday).length /
            activeHabits.length) *
            100,
        )
      : 0,
  };

  const weeklyProgress = stats?.weeklyProgress || [];
  const monthlyProgress = stats?.monthlyProgress || [];

  const displayCategories =
    stats?.categories?.filter((category) => category.total > 0) || [];

  const topHabitsByStreak = [...(stats?.habits || [])]
    .sort((left, right) => right.currentStreak - left.currentStreak)
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Habits
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> New Habit
        </button>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Today's Progress</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {todaySummary.completed} / {todaySummary.total}
            </p>
            <p className="text-sm text-gray-500">
              {todaySummary.percentage}% completed
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Current Streak
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.streak?.current || 0}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Best Streak
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.streak?.best || 0}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Weekly Completion
            </h2>
            <Sparkles size={16} className="text-blue-500" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => value.slice(5)}
                  stroke="#6b7280"
                />
                <YAxis allowDecimals={false} stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Categories
          </h2>
          <div className="space-y-3">
            {displayCategories.map((entry) => (
              <div key={entry.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-200">
                    {CATEGORY_ICON[entry.category] || "✅"} {entry.category}
                  </span>
                  <span className="text-gray-500">
                    {entry.completed}/{entry.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${entry.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {!displayCategories.length && (
              <p className="text-sm text-gray-500">No category data yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Monthly Heatmap
        </h2>
        <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {monthlyProgress.map((day) => {
            const ratio = day.total ? day.completed / day.total : 0;
            let levelClass = "bg-gray-200 dark:bg-gray-700";
            if (ratio >= 0.75) levelClass = "bg-green-500";
            else if (ratio >= 0.5) levelClass = "bg-green-400";
            else if (ratio >= 0.25) levelClass = "bg-yellow-300";
            else if (ratio > 0) levelClass = "bg-orange-300";

            return (
              <div
                key={day.date}
                title={`${day.date}: ${day.completed}/${day.total}`}
                className={`h-8 rounded flex items-center justify-center text-[10px] text-gray-900 ${levelClass}`}
              >
                {day.date.slice(-2)}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Habit Streaks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topHabitsByStreak.map((habit) => (
            <div
              key={habit.habitId}
              className="p-3 rounded border border-gray-200 dark:border-gray-700"
            >
              <p className="font-semibold text-gray-900 dark:text-white">
                {habit.icon} {habit.name}
              </p>
              <p className="text-sm text-gray-500">{habit.category}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Current streak: {habit.currentStreak} days
              </p>
              <p className="text-xs text-gray-500">
                Monthly completion: {habit.monthlyCompletionPercentage}%
              </p>
            </div>
          ))}
          {!topHabitsByStreak.length && (
            <p className="text-sm text-gray-500">No streak data yet.</p>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {activeHabits.map((habit) => {
          const completedToday = Boolean(habit.completedToday);

          return (
            <Card key={habit._id}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold ${
                      completedToday
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {habit.icon || "✅"} {habit.habitName || habit.name}
                  </h3>
                  {habit.category && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {habit.category} • {habit.frequency || "Daily"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleToggleComplete(
                        habit._id,
                        Boolean(habit.completedToday),
                      )
                    }
                    className={`p-2 rounded ${
                      completedToday
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                    title={
                      completedToday ? "Mark incomplete" : "Complete today"
                    }
                  >
                    <Check
                      size={20}
                      className={
                        completedToday ? "text-green-600" : "text-gray-400"
                      }
                    />
                  </button>
                  <button
                    onClick={() => handleToggleActive(habit._id, habit.active)}
                    className="text-amber-500 hover:text-amber-700 p-2"
                    title="Disable habit"
                  >
                    <PauseCircle size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(habit._id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remove habit"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        {!activeHabits.length && (
          <Card>
            <p className="text-sm text-gray-500">No active habits found.</p>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        {!!inactiveHabits.length && (
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Inactive Habits
          </h2>
        )}
        {inactiveHabits.map((habit) => (
          <Card key={habit._id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">
                  {habit.icon || "✅"} {habit.habitName || habit.name}
                </p>
                <p className="text-sm text-gray-500">
                  {habit.category} • {habit.frequency || "Daily"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(habit._id, habit.active)}
                  className="text-green-600 hover:text-green-800 p-2"
                  title="Enable habit"
                >
                  <PlayCircle size={20} />
                </button>
                <button
                  onClick={() => handleDelete(habit._id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Create Habit"
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel="Add Habit"
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * Required fields
          </p>
          <div>
            <label
              htmlFor="habit-name"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Habit Name <span className="text-red-500">*</span>
            </label>
            <input
              id="habit-name"
              type="text"
              value={formData.habitName}
              onChange={(e) =>
                setFormData({ ...formData, habitName: e.target.value })
              }
              placeholder="Type habit name (e.g. Quran)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          {isSearching && (
            <p className="text-xs text-blue-500">
              Searching existing habits...
            </p>
          )}

          {!!suggestionMessage && (
            <div className="p-3 rounded border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {suggestionMessage}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={useExistingHabit}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Use Existing Habit
                </button>
                <button
                  onClick={() => setAllowCreateDifferent(true)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Create Different Habit
                </button>
              </div>
            </div>
          )}

          {!!searchResults.length && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Suggestions
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 dark:border-gray-700">
                {searchResults.map((item) => (
                  <button
                    key={`${item.source}-${item.id}`}
                    onClick={() => {
                      setSelectedSuggestion(item);
                      setFormData((prev) => ({
                        ...prev,
                        habitName: item.name,
                        category: item.category || prev.category,
                        icon: item.icon || prev.icon,
                        frequency: item.frequency || prev.frequency,
                      }));
                      setSuggestionMessage(`${item.name} already exists`);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.icon || "✅"} {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.category || "General"} • {item.frequency || "Daily"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="habit-category"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Category
            </label>
            <select
              id="habit-category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="habit-frequency"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Frequency
            </label>
            <select
              id="habit-frequency"
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              {FREQUENCY_OPTIONS.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, icon: option })}
                  className={`p-2 rounded border text-lg ${
                    formData.icon === option
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Default library size: {templates.length}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Habits;
