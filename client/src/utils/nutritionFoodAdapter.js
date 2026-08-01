import foodDatabase from "../data/nutrition/foodDatabase";

const POPULAR_FOOD_IDS = [
  "rice_white_cooked",
  "egg_boiled",
  "chicken_curry",
  "dal_masoor",
  "rui_curry",
  "banana",
  "roti",
];

const roundToOneDecimal = (value) => Math.round(Number(value || 0) * 10) / 10;

const roundToTwoDecimal = (value) => Math.round(Number(value || 0) * 100) / 100;

const clampWeight = (value) => {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    return 0;
  }
  return num;
};

const toPer100FromServing = (nutrition = {}, servingWeight = 100) => {
  const weight = Number(servingWeight) > 0 ? Number(servingWeight) : 100;
  const factor = 100 / weight;

  return {
    calories: roundToOneDecimal((nutrition.calories || 0) * factor),
    protein: roundToOneDecimal((nutrition.protein || 0) * factor),
    carbs: roundToOneDecimal((nutrition.carbs || 0) * factor),
    fat: roundToOneDecimal((nutrition.fat || nutrition.fats || 0) * factor),
    fiber: roundToOneDecimal((nutrition.fiber || 0) * factor),
  };
};

export const normalizedFoods = foodDatabase.map((food) => {
  const servingWeight = Number(food?.serving?.weight) || 100;
  const nutritionPer100g = toPer100FromServing(food.nutrition, servingWeight);

  return {
    id: food.id,
    name: food.name,
    banglaName: food.banglaName || "",
    category: food.category || "Other",
    serving: {
      ...food.serving,
      weight: servingWeight,
    },
    nutrition: nutritionPer100g,
    keywords: [food.name, food.banglaName, food.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
});

export const foodCategories = Array.from(
  new Set(normalizedFoods.map((food) => food.category)),
).sort((a, b) => a.localeCompare(b));

export const getPopularFoods = () => {
  const popularSet = new Set(POPULAR_FOOD_IDS);
  const inOrder = POPULAR_FOOD_IDS.map((id) =>
    normalizedFoods.find((food) => food.id === id),
  ).filter(Boolean);

  if (inOrder.length >= 6) {
    return inOrder.slice(0, 6);
  }

  const fallback = normalizedFoods
    .filter((food) => !popularSet.has(food.id))
    .slice(0, 6 - inOrder.length);

  return [...inOrder, ...fallback];
};

export const filterFoods = ({ query = "", category = "all" } = {}) => {
  const normalizedQuery = query.trim().toLowerCase();

  return normalizedFoods.filter((food) => {
    const categoryMatch = category === "all" || food.category === category;
    if (!categoryMatch) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return food.keywords.includes(normalizedQuery);
  });
};

export const calculateNutritionFromWeight = (food, consumedWeight) => {
  const weight = clampWeight(consumedWeight);
  const factor = weight / 100;

  return {
    consumedWeight: weight,
    calories: roundToOneDecimal((food?.nutrition?.calories || 0) * factor),
    protein: roundToOneDecimal((food?.nutrition?.protein || 0) * factor),
    carbs: roundToOneDecimal((food?.nutrition?.carbs || 0) * factor),
    fat: roundToOneDecimal((food?.nutrition?.fat || 0) * factor),
    fiber: roundToOneDecimal((food?.nutrition?.fiber || 0) * factor),
  };
};

export const buildNutritionSnapshot = (food, consumedWeight) => {
  const totals = calculateNutritionFromWeight(food, consumedWeight);

  return {
    foodId: food?.id || "",
    foodName: food?.name || "",
    foodCategory: food?.category || "",
    consumedWeight: totals.consumedWeight,
    nutritionSnapshot: {
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      fiber: totals.fiber,
      per100g: {
        calories: roundToTwoDecimal(food?.nutrition?.calories || 0),
        protein: roundToTwoDecimal(food?.nutrition?.protein || 0),
        carbs: roundToTwoDecimal(food?.nutrition?.carbs || 0),
        fat: roundToTwoDecimal(food?.nutrition?.fat || 0),
        fiber: roundToTwoDecimal(food?.nutrition?.fiber || 0),
      },
    },
  };
};

export const toLegacyMacros = (snapshot = {}) => ({
  protein: Number(snapshot.protein || 0),
  carbs: Number(snapshot.carbs || 0),
  fats: Number(snapshot.fat || 0),
});
