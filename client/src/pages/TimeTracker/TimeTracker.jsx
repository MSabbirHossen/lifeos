import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const TimeTracker = () => {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    task: "",
    category: "Study",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/time-tracker");
      setTrackers(data.data || data);
    } catch (error) {
      setError("Unable to load time entries right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/time-tracker", formData);
      setFormData({ task: "", category: "Study", startTime: "", endTime: "" });
      setIsModalOpen(false);
      fetchTrackers();
    } catch (error) {
      setError("Unable to save this time entry.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/time-tracker/${id}`);
      fetchTrackers();
    } catch (error) {
      setError("Unable to delete this time entry.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Time Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Start Task
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading entries...</div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">{error}</div>
      ) : trackers.length === 0 ? (
        <Card>
          <p className="text-gray-600 dark:text-gray-400">No time entries yet. Add your first one to start tracking.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {trackers.map((tracker) => (
            <Card key={tracker._id}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {tracker.task}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Category: {tracker.category}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Duration: {tracker.duration} minutes
                  </p>
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
      )}

      <Modal
        isOpen={isModalOpen}
        title="Track Time"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Task Name"
            value={formData.task}
            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="Study">Study</option>
            <option value="Fitness">Fitness</option>
            <option value="Islamic">Islamic</option>
            <option value="Work">Work</option>
            <option value="Social">Social</option>
            <option value="Sleep">Sleep</option>
          </select>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default TimeTracker;
