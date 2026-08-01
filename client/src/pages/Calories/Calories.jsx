import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Plus,
  Trash2,
  Pencil,
  Star,
  Search,
  Filter,
  Flame,
  Droplets,
  Target,
  Apple,
  Clock3,
} from "lucide-react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import {
  normalizedFoods,
  foodCategories,
  getPopularFoods,
  filterFoods,
  calculateNutritionFromWeight,
  buildNutritionSnapshot,
  toLegacyMacros,
} from "../../utils/nutritionFoodAdapter";

const CALORIE_GOAL = 2000;
const PROTEIN_GOAL = 120;
const CARBS_GOAL = 250;
const FAT_GOAL = 80;
const WATER_GOAL_ML = 3000;

const FAVORITES_KEY = "calories.favoriteFoods";
const RECENTS_KEY = "calories.recentFoods";

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", icon: "🌅" },
  { id: "lunch", label: "Lunch", icon: "🍛" },
  { id: "dinner", label: "Dinner", icon: "🌙" },
  { id: "snack", label: "Snack", icon: "🍎" },
];

const defaultFormData = {
  mealType: "breakfast",
  foodId: "",
  consumedWeight: 100,
  waterIntake: 0,
};

const roundToOneDecimal = (value) => Math.round(Number(value || 0) * 10) / 10;

const formatMealTime = (dateValue) =>
  new Date(dateValue).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const formatMealDate = (dateValue) => new Date(dateValue).toDateString();

const isToday = (dateValue) =>
  formatMealDate(dateValue) === new Date().toDateString();

const Calories = () => {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState("");
  const [trackerToDelete, setTrackerToDelete] = useState(null);

  const [formData, setFormData] = useState(defaultFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);

  const selectedFood = useMemo(
    () => normalizedFoods.find((food) => food.id === formData.foodId) || null,
    [formData.foodId],
  );

  const filteredFoods = useMemo(
    () => filterFoods({ query: searchQuery, category: selectedCategory }),
    [searchQuery, selectedCategory],
  );

  const suggestions = useMemo(() => {
    const favored = filteredFoods.filter((food) =>
      favoriteIds.includes(food.id),
    );
    const others = filteredFoods.filter(
      (food) => !favoriteIds.includes(food.id),
    );
    return [...favored, ...others].slice(0, 10);
  }, [filteredFoods, favoriteIds]);

  const recentFoods = useMemo(
    () =>
      recentIds
        .map((id) => normalizedFoods.find((food) => food.id === id))
        .filter(Boolean),
    [recentIds],
  );

  const popularFoods = useMemo(() => getPopularFoods(), []);

  const liveNutrition = useMemo(() => {
    if (!selectedFood) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
    }
    return calculateNutritionFromWeight(selectedFood, formData.consumedWeight);
  }, [selectedFood, formData.consumedWeight]);

  const todayMeals = useMemo(
    () => trackers.filter((tracker) => isToday(tracker.date)),
    [trackers],
  );

  const todaysTotals = useMemo(() => {
    return todayMeals.reduce(
      (sum, tracker) => {
        const protein =
          tracker.nutritionSnapshot?.protein ?? tracker.macros?.protein ?? 0;
        const carbs =
          tracker.nutritionSnapshot?.carbs ?? tracker.macros?.carbs ?? 0;
        const fat =
          tracker.nutritionSnapshot?.fat ??
          tracker.macros?.fats ??
          tracker.macros?.fat ??
          0;
        const fiber = tracker.nutritionSnapshot?.fiber ?? 0;

        return {
          calories: sum.calories + Number(tracker.calories || 0),
          protein: sum.protein + Number(protein || 0),
          carbs: sum.carbs + Number(carbs || 0),
          fat: sum.fat + Number(fat || 0),
          fiber: sum.fiber + Number(fiber || 0),
          waterIntake: sum.waterIntake + Number(tracker.waterIntake || 0),
        };
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        waterIntake: 0,
      },
    );
  }, [todayMeals]);

  const caloriesRemaining = Math.max(0, CALORIE_GOAL - todaysTotals.calories);
  const calorieProgress = Math.min(
    100,
    (todaysTotals.calories / CALORIE_GOAL) * 100 || 0,
  );

  useEffect(() => {
    fetchTrackers();
    hydrateLocalFoodState();
  }, []);

  const hydrateLocalFoodState = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      const recents = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");

      setFavoriteIds(Array.isArray(favorites) ? favorites : []);
      setRecentIds(Array.isArray(recents) ? recents : []);
    } catch (storageError) {
      console.error("Error reading nutrition local preferences:", storageError);
      setFavoriteIds([]);
      setRecentIds([]);
    }
  };

  const persistFavoriteIds = (next) => {
    setFavoriteIds(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const pushRecentFood = (foodId) => {
    if (!foodId) return;

    const next = [foodId, ...recentIds.filter((id) => id !== foodId)].slice(
      0,
      12,
    );
    setRecentIds(next);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  };

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/calories");
      const payload = response?.data;
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      setTrackers(list);
    } catch (requestError) {
      console.error("Error fetching calorie trackers:", requestError);
      setError("Unable to load nutrition logs right now.");
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    setFormData(defaultFormData);
    setEditingTrackerId("");
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const openCreateModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const openEditModal = (tracker) => {
    const detectedFood =
      normalizedFoods.find((food) => food.id === tracker.foodId) ||
      normalizedFoods.find(
        (food) =>
          food.name.trim().toLowerCase() ===
          tracker.foodName?.trim().toLowerCase(),
      ) ||
      null;

    setEditingTrackerId(tracker._id);
    setFormData({
      mealType: tracker.mealType || "breakfast",
      foodId: detectedFood?.id || "",
      consumedWeight: Number(tracker.consumedWeight || 100),
      waterIntake: Number(tracker.waterIntake || 0),
    });
    setSearchQuery(detectedFood?.name || "");
    setSelectedCategory(detectedFood?.category || "all");
    setIsModalOpen(true);
  };

  const toggleFavorite = (foodId) => {
    const next = favoriteIds.includes(foodId)
      ? favoriteIds.filter((id) => id !== foodId)
      : [foodId, ...favoriteIds].slice(0, 30);
    persistFavoriteIds(next);
  };

  const selectFood = (food) => {
    setFormData((prev) => ({
      ...prev,
      foodId: food.id,
      consumedWeight:
        Number(prev.consumedWeight) > 0
          ? Number(prev.consumedWeight)
          : Number(food.serving?.weight || 100),
    }));
    setSearchQuery(food.name);
    setSelectedCategory(food.category || "all");
  };

  const handleQuickAdd = (food) => {
    openCreateModal();
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        foodId: food.id,
        consumedWeight: Number(food.serving?.weight || 100),
      }));
      setSearchQuery(food.name);
      setSelectedCategory(food.category || "all");
    }, 0);
  };

  const handleSubmit = async () => {
    if (!selectedFood) {
      setError("Please select a food from the Bangladesh nutrition database.");
      return;
    }

    const consumedWeight = Number(formData.consumedWeight) || 0;
    if (consumedWeight <= 0) {
      setError("Consumed weight must be greater than 0g.");
      return;
    }

    const snapshot = buildNutritionSnapshot(selectedFood, consumedWeight);
    const servingWeight = Number(selectedFood.serving?.weight) || 100;
    const servingMultiplier = roundToOneDecimal(consumedWeight / servingWeight);

    const payload = {
      mealType: formData.mealType,
      foodId: snapshot.foodId,
      foodCategory: snapshot.foodCategory,
      foodName: snapshot.foodName,
      consumedWeight: snapshot.consumedWeight,
      servingMultiplier,
      calories: snapshot.nutritionSnapshot.calories,
      macros: toLegacyMacros(snapshot.nutritionSnapshot),
      waterIntake: Number(formData.waterIntake || 0),
      nutritionSnapshot: snapshot.nutritionSnapshot,
    };

    try {
      setError("");
      if (editingTrackerId) {
        await API.put(`/calories/${editingTrackerId}`, payload);
      } else {
        await API.post("/calories", payload);
      }
      pushRecentFood(snapshot.foodId);
      setIsModalOpen(false);
      resetModalState();
      fetchTrackers();
    } catch (requestError) {
      console.error("Error saving nutrition log:", requestError);
      setError("Failed to save meal. Please try again.");
    }
  };

  const requestDeleteTracker = (tracker) => {
    setTrackerToDelete(tracker);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!trackerToDelete?._id) return;
    try {
      await API.delete(`/calories/${trackerToDelete._id}`);
      setIsDeleteOpen(false);
      setTrackerToDelete(null);
      fetchTrackers();
    } catch (requestError) {
      console.error("Error deleting nutrition log:", requestError);
      setError("Could not delete this meal right now.");
      setIsDeleteOpen(false);
    }
  };

  const getMacroPercentage = (value, target) =>
    Math.min(100, (Number(value || 0) / Number(target || 1)) * 100);

  const macroRows = [
    {
      key: "protein",
      label: "Protein",
      value: todaysTotals.protein,
      goal: PROTEIN_GOAL,
      color: "bg-emerald-500",
    },
    {
      key: "carbs",
      label: "Carbs",
      value: todaysTotals.carbs,
      goal: CARBS_GOAL,
      color: "bg-amber-500",
    },
    {
      key: "fat",
      label: "Fat",
      value: todaysTotals.fat,
      goal: FAT_GOAL,
      color: "bg-rose-500",
    },
  ];

  const mealTypeMap = MEAL_TYPES.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const sortedTodayMeals = [...todayMeals].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nutrition Tracker
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bangladesh food intelligence with auto nutrition calculations
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Log Meal
        </button>
      </div>

      {error && (
        <Card className="border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Calories Consumed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(todaysTotals.calories)}
                <span className="text-base font-medium text-gray-500">
                  {" "}
                  / {CALORIE_GOAL} kcal
                </span>
              </p>
            </div>
            <Flame className="text-orange-500" size={26} />
          </div>
          <div className="mt-3 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${calorieProgress}%` }}
            />
          </div>
        </Card>

        <Card className="border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Protein
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roundToOneDecimal(todaysTotals.protein)}g
              </p>
              <p className="text-xs text-gray-500">Target: {PROTEIN_GOAL}g</p>
            </div>
            <Apple className="text-emerald-500" size={24} />
          </div>
        </Card>

        <Card className="border border-cyan-100 dark:border-cyan-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Water</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roundToOneDecimal(todaysTotals.waterIntake / 1000)}L
              </p>
              <p className="text-xs text-gray-500">
                Target: {WATER_GOAL_ML / 1000}L
              </p>
            </div>
            <Droplets className="text-cyan-500" size={24} />
          </div>
        </Card>

        <Card className="border border-amber-100 dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Remaining Calories
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(caloriesRemaining)} kcal
              </p>
            </div>
            <Target className="text-amber-500" size={24} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border border-gray-100 dark:border-gray-700/60">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Today's Nutrition
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Consumed",
                      value: Math.min(todaysTotals.calories, CALORIE_GOAL),
                    },
                    {
                      name: "Remaining",
                      value: Math.max(CALORIE_GOAL - todaysTotals.calories, 0),
                    },
                  ]}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={100}
                  stroke="none"
                >
                  <Cell fill="#2563EB" />
                  <Cell fill="#E5E7EB" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-40 flex flex-col items-center pointer-events-none">
              <p className="text-sm text-gray-500">Consumed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(todaysTotals.calories)} kcal
              </p>
              <p className="text-xs text-gray-500">Goal: {CALORIE_GOAL} kcal</p>
              <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">
                Remaining: {Math.round(caloriesRemaining)} kcal
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-700/60">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Macros Progress
          </h2>
          <div className="space-y-4">
            {macroRows.map((macro) => (
              <div key={macro.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {macro.label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {roundToOneDecimal(macro.value)} / {macro.goal}g
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${macro.color}`}
                    style={{
                      width: `${getMacroPercentage(macro.value, macro.goal)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
              Fiber consumed: {roundToOneDecimal(todaysTotals.fiber)}g
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-gray-100 dark:border-gray-700/60">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Quick Add
        </h2>
        <div className="flex flex-wrap gap-2">
          {popularFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => handleQuickAdd(food)}
              className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm"
            >
              + {food.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border border-gray-100 dark:border-gray-700/60">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Meal Timeline
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading meals...
          </p>
        ) : sortedTodayMeals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-5 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No meals logged today. Start by adding your first meal.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTodayMeals.map((tracker) => {
              const mealType = mealTypeMap[tracker.mealType] || {
                label: tracker.mealType,
                icon: "🍽️",
              };
              const protein =
                tracker.nutritionSnapshot?.protein ??
                tracker.macros?.protein ??
                0;
              const carbs =
                tracker.nutritionSnapshot?.carbs ?? tracker.macros?.carbs ?? 0;
              const fat =
                tracker.nutritionSnapshot?.fat ??
                tracker.macros?.fats ??
                tracker.macros?.fat ??
                0;

              return (
                <div
                  key={tracker._id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-800/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {mealType.icon} {mealType.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Clock3 size={12} /> {formatMealTime(tracker.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(tracker)}
                        className="p-1.5 text-gray-500 hover:text-blue-600"
                        aria-label="Edit meal"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => requestDeleteTracker(tracker)}
                        className="p-1.5 text-gray-500 hover:text-red-600"
                        aria-label="Delete meal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {tracker.foodName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {roundToOneDecimal(tracker.consumedWeight)}g ·{" "}
                      {Math.round(tracker.calories)} kcal
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="px-2 py-1 rounded bg-white dark:bg-gray-700">
                      Protein {roundToOneDecimal(protein)}g
                    </div>
                    <div className="px-2 py-1 rounded bg-white dark:bg-gray-700">
                      Carbs {roundToOneDecimal(carbs)}g
                    </div>
                    <div className="px-2 py-1 rounded bg-white dark:bg-gray-700">
                      Fat {roundToOneDecimal(fat)}g
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        title={editingTrackerId ? "Edit Meal" : "Log Meal"}
        onClose={() => {
          setIsModalOpen(false);
          resetModalState();
        }}
        onSubmit={handleSubmit}
        submitLabel={editingTrackerId ? "Save Changes" : "Save Meal"}
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              1. Meal Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MEAL_TYPES.map((meal) => {
                const active = formData.mealType === meal.id;
                return (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, mealType: meal.id }))
                    }
                    className={`rounded-lg border p-2 text-left transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-xs text-gray-500">{meal.icon}</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {meal.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              2. Food Search
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-2 relative">
                <label htmlFor="food-search" className="sr-only">
                  Search by English or Bangla name
                </label>
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
                <input
                  id="food-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by English or Bangla name (e.g. bhaat / ভাত)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 pl-9 pr-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="relative">
                <Filter
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 pl-9 pr-3 py-2 bg-white dark:bg-gray-800"
                >
                  <option value="all">All categories</option>
                  {foodCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 max-h-60 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Suggestions
                </p>
                <div className="space-y-2">
                  {suggestions.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No matching foods found.
                    </p>
                  ) : (
                    suggestions.map((food) => {
                      const active = formData.foodId === food.id;
                      return (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => selectFood(food)}
                          className={`w-full text-left rounded-lg border px-3 py-2 ${
                            active
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                {food.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                বাংলা: {food.banglaName || "-"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {food.category} · {food.nutrition.calories} kcal
                                per 100g
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(food.id);
                              }}
                              className={`p-1 ${
                                favoriteIds.includes(food.id)
                                  ? "text-amber-500"
                                  : "text-gray-400"
                              }`}
                              aria-label="Toggle favorite food"
                            >
                              <Star
                                size={14}
                                fill={
                                  favoriteIds.includes(food.id)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Recent Foods
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentFoods.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No recent foods yet.
                      </p>
                    ) : (
                      recentFoods.slice(0, 6).map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => selectFood(food)}
                          className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs"
                        >
                          {food.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Popular Foods
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularFoods.slice(0, 6).map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => selectFood(food)}
                        className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-xs"
                      >
                        {food.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedFood && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-3 bg-blue-50/60 dark:bg-blue-900/10">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedFood.name}
                </p>
                <p className="text-sm text-gray-500">Per 100g</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-sm">
                  <p>{selectedFood.nutrition.calories} kcal</p>
                  <p>P: {selectedFood.nutrition.protein}g</p>
                  <p>C: {selectedFood.nutrition.carbs}g</p>
                  <p>F: {selectedFood.nutrition.fat}g</p>
                  <p>Fiber: {selectedFood.nutrition.fiber}g</p>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              3. Quantity
            </h3>
            <div>
              <label
                htmlFor="consumed-weight"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Consumed Weight:{" "}
                {Math.round(Number(formData.consumedWeight || 0))}g
              </label>
              <input
                id="consumed-weight"
                type="range"
                min="10"
                max="1000"
                step="5"
                value={Number(formData.consumedWeight || 0)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consumedWeight: Number(e.target.value) || 0,
                  }))
                }
                className="w-full mt-2"
              />
              <input
                type="number"
                min="0"
                value={Number(formData.consumedWeight || 0)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consumedWeight: Number(e.target.value) || 0,
                  }))
                }
                className="w-full mt-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              4. Nutrition Preview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                <p className="text-xs text-gray-500">Calories</p>
                <p className="font-bold">{liveNutrition.calories} kcal</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                <p className="text-xs text-gray-500">Protein</p>
                <p className="font-bold">{liveNutrition.protein} g</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                <p className="text-xs text-gray-500">Carbs</p>
                <p className="font-bold">{liveNutrition.carbs} g</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                <p className="text-xs text-gray-500">Fat</p>
                <p className="font-bold">{liveNutrition.fat} g</p>
              </div>
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                <p className="text-xs text-gray-500">Fiber</p>
                <p className="font-bold">{liveNutrition.fiber} g</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  value={liveNutrition.calories}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-2 py-2 bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Protein
                </label>
                <input
                  type="number"
                  value={liveNutrition.protein}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-2 py-2 bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Carbs
                </label>
                <input
                  type="number"
                  value={liveNutrition.carbs}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-2 py-2 bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fat</label>
                <input
                  type="number"
                  value={liveNutrition.fat}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-2 py-2 bg-gray-100 dark:bg-gray-700"
                />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              5. Water Intake
            </h3>
            <input
              type="number"
              min="0"
              value={formData.waterIntake}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  waterIntake: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
              placeholder="Water intake in ml"
            />
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        title="Delete Meal"
        onClose={() => {
          setIsDeleteOpen(false);
          setTrackerToDelete(null);
        }}
        onSubmit={handleDelete}
        submitLabel="Delete"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          {trackerToDelete?.foodName || "this meal"}? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

export default Calories;
