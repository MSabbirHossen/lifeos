import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";
import { calorieFoods } from "../../data/calorieFoods";

const Calories = () => {
  const [trackers, setTrackers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    mealType: "breakfast",
    foodName: "",
    consumedWeight: 0,
    servingMultiplier: 1,
    calories: 0,
    macros: { protein: 0, carbs: 0, fats: 0 },
    waterIntake: 0,
  });

  useEffect(() => {
    fetchTrackers();
  }, []);

  const roundToOneDecimal = (value) => Math.round(value * 10) / 10;

  const findFoodByName = (name) =>
    calorieFoods.find(
      (food) => food.name.toLowerCase() === name.trim().toLowerCase(),
    );

  const calculateNutritionByWeight = (food, consumedWeight) => {
    const weight = Number(consumedWeight) || 0;
    const factor = food.gramWeight > 0 ? weight / food.gramWeight : 0;

    return {
      calories: Math.round(food.calories * factor),
      protein: roundToOneDecimal(food.protein * factor),
      carbs: roundToOneDecimal(food.carbs * factor),
      fats: roundToOneDecimal(food.fat * factor),
    };
  };

  const calculateNutritionByMultiplier = (food, multiplier) => {
    const safeMultiplier = Number(multiplier) || 0;
    const weight = food.gramWeight * safeMultiplier;
    return {
      consumedWeight: roundToOneDecimal(weight),
      ...calculateNutritionByWeight(food, weight),
    };
  };

  const handleFoodNameChange = (value) => {
    const matchedFood = findFoodByName(value);

    if (!matchedFood) {
      setFormData((prev) => ({ ...prev, foodName: value }));
      return;
    }

    const servingMultiplier =
      Number(formData.servingMultiplier) > 0
        ? Number(formData.servingMultiplier)
        : 1;
    const nutrition = calculateNutritionByMultiplier(
      matchedFood,
      servingMultiplier,
    );

    setFormData((prev) => ({
      ...prev,
      foodName: matchedFood.name,
      servingMultiplier,
      consumedWeight: nutrition.consumedWeight,
      calories: nutrition.calories,
      macros: {
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fats,
      },
    }));
  };

  const handleConsumedWeightChange = (value) => {
    const consumedWeight = Number(value) || 0;
    const matchedFood = findFoodByName(formData.foodName);

    if (!matchedFood) {
      setFormData((prev) => ({ ...prev, consumedWeight }));
      return;
    }

    const nutrition = calculateNutritionByWeight(matchedFood, consumedWeight);
    const servingMultiplier =
      matchedFood.gramWeight > 0
        ? roundToOneDecimal(consumedWeight / matchedFood.gramWeight)
        : 0;

    setFormData((prev) => ({
      ...prev,
      consumedWeight,
      servingMultiplier,
      calories: nutrition.calories,
      macros: {
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fats,
      },
    }));
  };

  const handleServingMultiplierChange = (value) => {
    const servingMultiplier = Number(value) || 0;
    const matchedFood = findFoodByName(formData.foodName);

    if (!matchedFood) {
      setFormData((prev) => ({ ...prev, servingMultiplier }));
      return;
    }

    const nutrition = calculateNutritionByMultiplier(
      matchedFood,
      servingMultiplier,
    );

    setFormData((prev) => ({
      ...prev,
      servingMultiplier,
      consumedWeight: nutrition.consumedWeight,
      calories: nutrition.calories,
      macros: {
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fats,
      },
    }));
  };

  const fetchTrackers = async () => {
    try {
      const { data } = await API.get("/calories");
      setTrackers(data);
    } catch (error) {
      console.error("Error fetching calorie trackers:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/calories", formData);
      setFormData({
        mealType: "breakfast",
        foodName: "",
        consumedWeight: 0,
        servingMultiplier: 1,
        calories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 },
        waterIntake: 0,
      });
      setIsModalOpen(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error creating calorie tracker:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/calories/${id}`);
      fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
    }
  };

  const todayCalories = trackers
    .filter(
      (t) => new Date(t.date).toDateString() === new Date().toDateString(),
    )
    .reduce((sum, t) => sum + t.calories, 0);

  const todayWater = trackers
    .filter(
      (t) => new Date(t.date).toDateString() === new Date().toDateString(),
    )
    .reduce((sum, t) => sum + t.waterIntake, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Calorie Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Log Meal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Today's Calories</p>
            <p className="text-3xl font-bold text-blue-500">{todayCalories}</p>
            <p className="text-sm text-gray-500">kcal</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Water Intake</p>
            <p className="text-3xl font-bold text-cyan-500">{todayWater}</p>
            <p className="text-sm text-gray-500">ml</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Goal</p>
            <p className="text-3xl font-bold text-green-500">2000</p>
            <p className="text-sm text-gray-500">kcal</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {trackers.map((tracker) => (
          <Card key={tracker._id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tracker.foodName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-semibold capitalize">
                    {tracker.mealType}
                  </span>{" "}
                  - {new Date(tracker.date).toLocaleTimeString()}
                </p>
                {tracker.consumedWeight > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Weight: {tracker.consumedWeight} g
                    {tracker.servingMultiplier > 0
                      ? ` (${tracker.servingMultiplier}x serving)`
                      : ""}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <p className="text-sm">
                    <strong>Calories:</strong> {tracker.calories}
                  </p>
                  <p className="text-sm">
                    <strong>Protein:</strong> {tracker.macros?.protein}g
                  </p>
                  <p className="text-sm">
                    <strong>Carbs:</strong> {tracker.macros?.carbs}g
                  </p>
                  <p className="text-sm">
                    <strong>Fats:</strong> {tracker.macros?.fats}g
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(tracker._id)}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Log Meal"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * Required fields
          </p>
          <div>
            <label
              htmlFor="calories-meal-type"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Meal Type <span className="text-red-500">*</span>
            </label>
            <select
              id="calories-meal-type"
              value={formData.mealType}
              onChange={(e) =>
                setFormData({ ...formData, mealType: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="calories-food-name"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Food Name <span className="text-red-500">*</span>
            </label>
            <input
              id="calories-food-name"
              type="text"
              list="calorie-food-options"
              value={formData.foodName}
              onChange={(e) => handleFoodNameChange(e.target.value)}
              placeholder="Search foods (e.g., chicken curry, bhaat, roti)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <datalist id="calorie-food-options">
              {calorieFoods.map((food) => (
                <option
                  key={food.id}
                  value={food.name}
                  label={`${food.category} | ${food.calories} kcal | ${food.servingSize} ${food.servingUnit}`}
                />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selecting a listed food auto-fills calories and macros, then the
              values scale when you change consumed weight.
            </p>
          </div>

          <div>
            <label
              htmlFor="calories-multiplier"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Serving Multiplier (x)
            </label>
            <input
              id="calories-multiplier"
              type="number"
              step="0.1"
              min="0"
              value={formData.servingMultiplier}
              onChange={(e) => handleServingMultiplierChange(e.target.value)}
              placeholder="Enter serving multiplier (e.g., 1.5)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="calories-weight"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Consumed Weight (g)
            </label>
            <input
              id="calories-weight"
              type="number"
              value={formData.consumedWeight}
              onChange={(e) => handleConsumedWeightChange(e.target.value)}
              placeholder="Enter grams eaten (e.g., 120)"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="calories-amount"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Calories <span className="text-red-500">*</span>
            </label>
            <input
              id="calories-amount"
              type="number"
              value={formData.calories}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  calories: Number(e.target.value) || 0,
                })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="calories-protein"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Protein (g)
              </label>
              <input
                id="calories-protein"
                type="number"
                value={formData.macros.protein}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macros: {
                      ...formData.macros,
                      protein: Number(e.target.value) || 0,
                    },
                  })
                }
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="calories-carbs"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Carbs (g)
              </label>
              <input
                id="calories-carbs"
                type="number"
                value={formData.macros.carbs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macros: {
                      ...formData.macros,
                      carbs: Number(e.target.value) || 0,
                    },
                  })
                }
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="calories-fats"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Fats (g)
              </label>
              <input
                id="calories-fats"
                type="number"
                value={formData.macros.fats}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macros: {
                      ...formData.macros,
                      fats: Number(e.target.value) || 0,
                    },
                  })
                }
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="calories-water"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Water Intake (ml)
            </label>
            <input
              id="calories-water"
              type="number"
              value={formData.waterIntake}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  waterIntake: Number(e.target.value) || 0,
                })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Calories;
