import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus, Check } from "lucide-react";

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    habitName: "",
    category: "",
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const { data } = await API.get("/habits");
      setHabits(data);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/habits", formData);
      setFormData({ habitName: "", category: "" });
      setIsModalOpen(false);
      fetchHabits();
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleToggle = async (id, status) => {
    try {
      await API.put(`/habits/${id}`, { status: !status, date: new Date() });
      fetchHabits();
    } catch (error) {
      console.error("Error updating habit:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/habits/${id}`);
      fetchHabits();
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const completedToday = habits.filter((h) => {
    const lastUpdate = new Date(h.date);
    return h.status && lastUpdate.toDateString() === new Date().toDateString();
  }).length;

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

      <Card>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Completed Today</p>
          <p className="text-3xl font-bold text-green-500">{completedToday}</p>
          <p className="text-sm text-gray-500">of {habits.length}</p>
        </div>
      </Card>

      <div className="space-y-3">
        {habits.map((habit) => {
          const lastUpdate = new Date(habit.date);
          const completedToday =
            habit.status &&
            lastUpdate.toDateString() === new Date().toDateString();

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
                    {habit.habitName}
                  </h3>
                  {habit.category && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {habit.category}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(habit._id, habit.status)}
                    className={`p-2 rounded ${
                      completedToday
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <Check
                      size={20}
                      className={
                        completedToday ? "text-green-600" : "text-gray-400"
                      }
                    />
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
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        title="Create New Habit"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Habit Name"
            value={formData.habitName}
            onChange={(e) =>
              setFormData({ ...formData, habitName: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Habits;
