import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const Fitness = () => {
  const [trackers, setTrackers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    exercise: "",
    type: "cardio",
    duration: 0,
    caloriesBurned: 0,
    weight: 0,
  });

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      const { data } = await API.get("/fitness");
      setTrackers(data);
    } catch (error) {
      console.error("Error fetching fitness trackers:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/fitness", formData);
      setFormData({
        exercise: "",
        type: "cardio",
        duration: 0,
        caloriesBurned: 0,
        weight: 0,
      });
      setIsModalOpen(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error creating fitness tracker:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/fitness/${id}`);
      fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
    }
  };

  const totalCalories = trackers.reduce(
    (sum, t) => sum + (t.caloriesBurned || 0),
    0
  );
  const totalDuration = trackers.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fitness Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Log Workout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Workouts</p>
            <p className="text-3xl font-bold text-blue-500">
              {trackers.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Duration</p>
            <p className="text-3xl font-bold text-green-500">{totalDuration}</p>
            <p className="text-sm text-gray-500">minutes</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Calories Burned</p>
            <p className="text-3xl font-bold text-red-500">{totalCalories}</p>
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
                  {tracker.exercise}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-semibold capitalize">
                    {tracker.type}
                  </span>{" "}
                  - {new Date(tracker.date).toLocaleDateString()}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <p className="text-sm">
                    <strong>Duration:</strong> {tracker.duration} min
                  </p>
                  <p className="text-sm">
                    <strong>Calories:</strong> {tracker.caloriesBurned}
                  </p>
                  {tracker.weight && (
                    <p className="text-sm">
                      <strong>Weight:</strong> {tracker.weight} kg
                    </p>
                  )}
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
        title="Log Workout"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Exercise Name"
            value={formData.exercise}
            onChange={(e) =>
              setFormData({ ...formData, exercise: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="cardio">Cardio</option>
            <option value="strength">Strength</option>
            <option value="flexibility">Flexibility</option>
            <option value="sports">Sports</option>
          </select>
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: parseInt(e.target.value) })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Calories Burned"
            value={formData.caloriesBurned}
            onChange={(e) =>
              setFormData({
                ...formData,
                caloriesBurned: parseInt(e.target.value),
              })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={formData.weight}
            onChange={(e) =>
              setFormData({ ...formData, weight: parseFloat(e.target.value) })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Fitness;
