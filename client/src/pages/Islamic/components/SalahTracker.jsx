import React from "react";
import Card from "../../../components/Card";
import SalahCard from "./SalahCard";
import FastingTracker from "./FastingTracker";
import { SALAH_NAMES, SALAH_LABELS, formatDisplayDate } from "../islamicUtils";

const SalahTracker = ({ value, onChange, onSubmit, saving }) => {
  const updateSalah = (name, nextValue) => {
    onChange({
      ...value,
      salah: {
        ...value.salah,
        [name]: nextValue,
      },
    });
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Today&apos;s Salah
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatDisplayDate(new Date())}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SALAH_NAMES.map((name) => (
          <SalahCard
            key={name}
            name={name}
            label={SALAH_LABELS[name]}
            value={value.salah[name]}
            onChange={updateSalah}
          />
        ))}
      </div>

      <Card className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
        <FastingTracker
          fasting={value.fasting}
          fastingType={value.fastingType}
          onChange={(patch) => onChange({ ...value, ...patch })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="quran-pages"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Quran Pages
            </label>
            <input
              id="quran-pages"
              type="number"
              min="0"
              value={value.quranPages}
              onChange={(event) =>
                onChange({
                  ...value,
                  quranPages: Math.max(0, Number(event.target.value) || 0),
                })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="quality-notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Salah Quality Notes
            </label>
            <input
              id="quality-notes"
              value={value.qualityNotes || ""}
              onChange={(event) =>
                onChange({ ...value, qualityNotes: event.target.value })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="hadith-notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Hadith Notes
          </label>
          <textarea
            id="hadith-notes"
            rows="3"
            value={value.hadithNotes}
            onChange={(event) =>
              onChange({ ...value, hadithNotes: event.target.value })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Today"}
        </button>
      </div>
    </Card>
  );
};

export default SalahTracker;
