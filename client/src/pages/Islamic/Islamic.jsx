import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import API from "../../utils/api";
import { Trash2, Plus } from "lucide-react";

const Islamic = () => {
  const [trackers, setTrackers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    salah: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    quranPages: 0,
    hadithNotes: "",
    adhkar: [],
  });

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      const { data } = await API.get("/islamic");
      setTrackers(data);
    } catch (error) {
      console.error("Error fetching islamic trackers:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/islamic", formData);
      setFormData({
        salah: {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        },
        quranPages: 0,
        hadithNotes: "",
        adhkar: [],
      });
      setIsModalOpen(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error creating islamic tracker:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/islamic/${id}`);
      fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
    }
  };

  const todayTracker = trackers.find(
    (t) => new Date(t.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Islamic Tracker
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={20} /> Log
        </button>
      </div>

      {todayTracker && (
        <Card>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Today's Progress
          </h2>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((salah) => (
              <div
                key={salah}
                className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                  {salah}
                </p>
                <p className="text-2xl mt-2">
                  {todayTracker.salah?.[salah] ? "✓" : "○"}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quran Pages
              </p>
              <p className="text-2xl font-bold text-blue-500">
                {todayTracker.quranPages}
              </p>
            </div>
            {todayTracker.hadithNotes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hadith Notes
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {todayTracker.hadithNotes}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {trackers.map((tracker) => (
          <Card key={tracker._id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(tracker.date).toLocaleDateString()}
                </p>
                <div className="grid grid-cols-5 gap-2 my-3">
                  {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((salah) => (
                    <div key={salah} className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {salah}
                      </p>
                      <p className="text-lg">
                        {tracker.salah?.[salah] ? "✓" : "○"}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Quran: {tracker.quranPages} pages
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

      <Modal
        isOpen={isModalOpen}
        title="Log Islamic Activities"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <p className="font-semibold mb-2 text-gray-900 dark:text-white">
              Salah Status
            </p>
            <div className="space-y-2">
              {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((salah) => (
                <label
                  key={salah}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.salah[salah]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salah: { ...formData.salah, [salah]: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <span className="capitalize text-gray-700 dark:text-gray-300">
                    {salah}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <input
            type="number"
            placeholder="Quran Pages"
            value={formData.quranPages}
            onChange={(e) =>
              setFormData({ ...formData, quranPages: parseInt(e.target.value) })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <textarea
            placeholder="Hadith Notes"
            value={formData.hadithNotes}
            onChange={(e) =>
              setFormData({ ...formData, hadithNotes: e.target.value })
            }
            rows="3"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Islamic;
