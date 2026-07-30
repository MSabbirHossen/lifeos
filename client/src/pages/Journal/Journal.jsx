import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    mood: "neutral",
    activities: [],
    highlights: "",
    notes: "",
  });

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/journal");
      setJournals(data.data || data);
    } catch (error) {
      setError("Unable to load journal entries right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/journal", formData);
      setFormData({
        title: "",
        mood: "neutral",
        activities: [],
        highlights: "",
        notes: "",
      });
      setIsModalOpen(false);
      fetchJournals();
    } catch (error) {
      console.error("Error creating journal:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/journal/${id}`);
      fetchJournals();
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Journal
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> New Entry
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading entries...</div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">{error}</div>
      ) : journals.length === 0 ? (
        <Card>
          <p className="text-gray-600 dark:text-gray-400">No journal entries yet. Create your first entry to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {journals.map((journal) => (
          <Card key={journal._id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {journal.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(journal.date).toLocaleDateString()} - Mood:{" "}
                  {journal.mood}
                </p>
                <p className="mt-3 text-gray-700 dark:text-gray-300">
                  {journal.notes}
                </p>
                {journal.highlights && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    <strong>Highlights:</strong> {journal.highlights}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(journal._id)}
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
        title="New Journal Entry"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <select
            value={formData.mood}
            onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="neutral">Neutral</option>
            <option value="excited">Excited</option>
            <option value="anxious">Anxious</option>
            <option value="calm">Calm</option>
          </select>
          <input
            type="text"
            placeholder="Highlights"
            value={formData.highlights}
            onChange={(e) =>
              setFormData({ ...formData, highlights: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows="4"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Journal;
