export function calculateNutrition(food, grams) {
  const multiplier = grams / food.serving.weight;

  return {
    calories: Math.round(food.nutrition.calories * multiplier),

    protein: Number((food.nutrition.protein * multiplier).toFixed(1)),

    carbs: Number((food.nutrition.carbs * multiplier).toFixed(1)),

    fat: Number((food.nutrition.fat * multiplier).toFixed(1)),

    fiber: Number((food.nutrition.fiber * multiplier).toFixed(1)),
  };
}
