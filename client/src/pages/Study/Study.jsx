import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const Study = () => {
  const [studies, setStudies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "Web Dev",
    topic: "",
    duration: 0,
    notes: "",
    resources: [],
  });

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const { data } = await API.get("/study");
      setStudies(data);
    } catch (error) {
      console.error("Error fetching studies:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/study", formData);
      setFormData({
        subject: "Web Dev",
        topic: "",
        duration: 0,
        notes: "",
        resources: [],
      });
      setIsModalOpen(false);
      fetchStudies();
    } catch (error) {
      console.error("Error creating study record:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/study/${id}`);
      fetchStudies();
    } catch (error) {
      console.error("Error deleting study record:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Study Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Log Study
        </button>
      </div>

      <div className="space-y-4">
        {studies.map((study) => (
          <Card key={study._id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {study.topic}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Subject:{" "}
                  <span className="font-semibold">{study.subject}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Duration:{" "}
                  <span className="font-semibold">
                    {study.duration} minutes
                  </span>
                </p>
                {study.notes && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {study.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(study._id)}
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
        title="Log Study Session"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <select
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="Web Dev">Web Dev</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="OSINT">OSINT</option>
            <option value="Arabic">Arabic</option>
            <option value="Islamic Studies">Islamic Studies</option>
            <option value="IT Skills">IT Skills</option>
          </select>
          <input
            type="text"
            placeholder="Topic"
            value={formData.topic}
            onChange={(e) =>
              setFormData({ ...formData, topic: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: parseInt(e.target.value) })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows="3"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Study;
