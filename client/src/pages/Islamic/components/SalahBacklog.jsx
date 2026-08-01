import React, { useMemo, useState } from "react";
import Card from "../../../components/Card";
import { formatDisplayDate, toDateInputValue } from "../islamicUtils";

const SalahBacklog = ({ backlog, onSave, saving }) => {
  const [form, setForm] = useState({
    startDate: backlog?.startDate ? toDateInputValue(backlog.startDate) : "",
    completedDays: backlog?.completedDays || 0,
    notes: backlog?.notes || "",
    wasFastingOnStartDate: Boolean(backlog?.wasFastingOnStartDate),
  });
  const [error, setError] = useState("");

  const hasBacklog = Boolean(backlog?.startDate);

  const summaryRows = useMemo(
    () => [
      { label: "Total days", value: backlog?.totalDays || 0 },
      { label: "Completed", value: backlog?.completedDays || 0 },
      { label: "Remaining", value: backlog?.remainingDays || 0 },
      { label: "Progress", value: `${backlog?.progressPercentage || 0}%` },
    ],
    [backlog],
  );

  const handleSubmit = async () => {
    if (!form.startDate) {
      setError("Please choose a start date.");
      return;
    }

    if (Number(form.completedDays) < 0) {
      setError("Completed days cannot be negative.");
      return;
    }

    setError("");
    await onSave({
      startDate: form.startDate,
      completedDays: Number(form.completedDays) || 0,
      notes: form.notes,
      wasFastingOnStartDate: form.wasFastingOnStartDate,
    });
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Salah History Setup
        </h2>
        {hasBacklog && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Started {formatDisplayDate(backlog.startDate)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="salah-start-date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Start Tracking From
            </label>
            <input
              id="salah-start-date"
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
              max={toDateInputValue(new Date())}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="salah-completed-days"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Completed Makeup Days
            </label>
            <input
              id="salah-completed-days"
              type="number"
              min="0"
              value={form.completedDays}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  completedDays: event.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.wasFastingOnStartDate}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  wasFastingOnStartDate: event.target.checked,
                }))
              }
            />
            I was fasting on this day
          </label>

          <div>
            <label
              htmlFor="salah-backlog-notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Reason / Notes (optional)
            </label>
            <textarea
              id="salah-backlog-notes"
              rows="3"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Salah History"}
          </button>
        </div>

        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Backlog Summary
          </h3>
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {row.label}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {row.value}
              </span>
            </div>
          ))}
          {!hasBacklog && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a start date to begin tracking lifetime missed salah.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SalahBacklog;
