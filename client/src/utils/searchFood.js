import foodDatabase from "../data/nutrition/foodDatabase";

export function searchFood(query) {
  if (!query) return [];

  const keyword = query.toLowerCase();

  return foodDatabase.filter((food) => {
    const english = food.name.toLowerCase().includes(keyword);

    const bangla = food.banglaName?.includes(query);

    const category = food.category?.toLowerCase().includes(keyword);

    return english || bangla || category;
  });
}
