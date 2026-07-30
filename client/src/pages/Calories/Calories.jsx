import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const Calories = () => {
  const [trackers, setTrackers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    mealType: "breakfast",
    foodName: "",
    calories: 0,
    macros: { protein: 0, carbs: 0, fats: 0 },
    waterIntake: 0,
  });

  useEffect(() => {
    fetchTrackers();
  }, []);

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
      (t) => new Date(t.date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, t) => sum + t.calories, 0);

  const todayWater = trackers
    .filter(
      (t) => new Date(t.date).toDateString() === new Date().toDateString()
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
          <select
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
          <input
            type="text"
            placeholder="Food Name"
            value={formData.foodName}
            onChange={(e) =>
              setFormData({ ...formData, foodName: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Calories"
            value={formData.calories}
            onChange={(e) =>
              setFormData({ ...formData, calories: parseInt(e.target.value) })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Protein (g)"
              value={formData.macros.protein}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  macros: {
                    ...formData.macros,
                    protein: parseInt(e.target.value),
                  },
                })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              placeholder="Carbs (g)"
              value={formData.macros.carbs}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  macros: {
                    ...formData.macros,
                    carbs: parseInt(e.target.value),
                  },
                })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              placeholder="Fats (g)"
              value={formData.macros.fats}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  macros: {
                    ...formData.macros,
                    fats: parseInt(e.target.value),
                  },
                })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <input
            type="number"
            placeholder="Water Intake (ml)"
            value={formData.waterIntake}
            onChange={(e) =>
              setFormData({
                ...formData,
                waterIntake: parseInt(e.target.value),
              })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Calories;
