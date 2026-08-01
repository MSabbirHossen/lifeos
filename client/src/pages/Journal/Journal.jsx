import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import ReflectionPrompt from "../../components/ReflectionPrompt";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const defaultFormData = {
  title: "",
  mood: "neutral",
  activities: [],
  highlights: "",
  notes: "",
};

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState("");
  const [reflectionQuestion, setReflectionQuestion] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

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
      const payload = {
        ...formData,
        reflectionQuestion: reflectionQuestion
          ? {
              questionId: reflectionQuestion.id,
              text: reflectionQuestion.text,
              category: reflectionQuestion.category,
            }
          : undefined,
      };

      await API.post("/journal", payload);
      setFormData(defaultFormData);
      setReflectionQuestion(null);
      setReflectionError("");
      setIsModalOpen(false);
      fetchJournals();
    } catch (error) {
      console.error("Error creating journal:", error);
    }
  };

  const fetchRandomReflectionQuestion = async () => {
    try {
      setReflectionLoading(true);
      setReflectionError("");
      const { data } = await API.get("/journal/questions/random");
      setReflectionQuestion(data.question);
    } catch (questionError) {
      setReflectionError("Unable to load reflection question right now.");
      setReflectionQuestion(null);
    } finally {
      setReflectionLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsModalOpen(true);
    fetchRandomReflectionQuestion();
  };

  const appendQuestionToNotes = () => {
    if (!reflectionQuestion?.text) {
      return;
    }

    setFormData((prev) => {
      const separator = prev.notes.trim().length > 0 ? "\n\n" : "";
      return {
        ...prev,
        notes: `${prev.notes}${separator}Q: ${reflectionQuestion.text}\nA: `,
      };
    });
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
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> New Entry
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">
          Loading entries...
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">{error}</div>
      ) : journals.length === 0 ? (
        <Card>
          <p className="text-gray-600 dark:text-gray-400">
            No journal entries yet. Create your first entry to get started.
          </p>
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
                  {journal.reflectionQuestion?.text && (
                    <div className="mt-3 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                        Reflection Question
                      </p>
                      <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {journal.reflectionQuestion.text}
                      </p>
                      {journal.reflectionQuestion.category && (
                        <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                          Category: {journal.reflectionQuestion.category}
                        </p>
                      )}
                    </div>
                  )}
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * Required fields
          </p>
          <ReflectionPrompt
            question={reflectionQuestion?.text || ""}
            category={reflectionQuestion?.category || ""}
            loading={reflectionLoading}
            error={reflectionError}
            onRefresh={fetchRandomReflectionQuestion}
          />
          <div>
            <button
              type="button"
              onClick={appendQuestionToNotes}
              disabled={!reflectionQuestion?.text}
              className="w-full px-3 py-2 text-sm font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Insert Question Into Notes
            </button>
          </div>
          <div>
            <label
              htmlFor="journal-title"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="journal-title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="journal-mood"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Mood
            </label>
            <select
              id="journal-mood"
              value={formData.mood}
              onChange={(e) =>
                setFormData({ ...formData, mood: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="neutral">Neutral</option>
              <option value="excited">Excited</option>
              <option value="anxious">Anxious</option>
              <option value="calm">Calm</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="journal-highlights"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Highlights
            </label>
            <input
              id="journal-highlights"
              type="text"
              value={formData.highlights}
              onChange={(e) =>
                setFormData({ ...formData, highlights: e.target.value })
              }
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="journal-notes"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Notes
            </label>
            <textarea
              id="journal-notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows="4"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Journal;
