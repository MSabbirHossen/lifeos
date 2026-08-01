import riceStaples from "./bangladesh-food/rice-staples.json";
import dalPulses from "./bangladesh-food/dal-pulses.json";
import fish from "./bangladesh-food/fish.json";
import meatEggs from "./bangladesh-food/meat-eggs.json";
import vegetables from "./bangladesh-food/vegetables.json";
import fruits from "./bangladesh-food/fruits.json";
import breakfastSnacks from "./bangladesh-food/breakfast-snacks.json";
import beverages from "./bangladesh-food/beverages.json";
import oilsSpicesIngredients from "./bangladesh-food/oils-spices-ingredients.json";

export const foodDatabase = [
  ...riceStaples,
  ...dalPulses,
  ...fish,
  ...meatEggs,
  ...vegetables,
  ...fruits,
  ...breakfastSnacks,
  ...beverages,
  ...oilsSpicesIngredients,
];

export const foodCategories = [
  "Rice",
  "Dal",
  "Fish",
  "Meat",
  "Egg",
  "Vegetable",
  "Fruit",
  "Breakfast",
  "Snack",
  "Drink",
  "Oil",
  "Spice",
  "Ingredient",
];

export default foodDatabase;
