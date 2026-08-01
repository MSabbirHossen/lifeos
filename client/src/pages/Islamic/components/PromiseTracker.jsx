import React, { useMemo, useState } from "react";
import Card from "../../../components/Card";
import { PencilLine, Plus, Trash2 } from "lucide-react";

const initialForm = {
  id: "",
  type: "SALAH",
  title: "",
  targetAmount: 1,
  completedAmount: 0,
  notes: "",
};

const PromiseTracker = ({ promises, onCreate, onUpdate, onDelete, saving }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const submitLabel = form.id ? "Update Promise" : "Add Promise";

  const summary = useMemo(() => {
    const total = (promises || []).length;
    const finished = (promises || []).filter(
      (item) => item.remainingAmount === 0,
    ).length;
    return { total, finished };
  }, [promises]);

  const reset = () => {
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Promise title is required.");
      return;
    }

    if (Number(form.targetAmount) <= 0) {
      setError("Target amount must be greater than 0.");
      return;
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      targetAmount: Number(form.targetAmount),
      completedAmount: Math.max(0, Number(form.completedAmount) || 0),
      notes: form.notes,
    };

    setError("");
    if (form.id) {
      await onUpdate(form.id, payload);
    } else {
      await onCreate(payload);
    }
    reset();
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Promises & Commitments
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {summary.finished}/{summary.total} completed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <select
          value={form.type}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, type: event.target.value }))
          }
          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value="SALAH">Salah</option>
          <option value="FAST">Fast</option>
        </select>

        <input
          placeholder="Promise title"
          value={form.title}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, title: event.target.value }))
          }
          className="lg:col-span-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />

        <input
          type="number"
          min="1"
          value={form.targetAmount}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, targetAmount: event.target.value }))
          }
          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder="Target"
        />

        <input
          type="number"
          min="0"
          value={form.completedAmount}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              completedAmount: event.target.value,
            }))
          }
          className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder="Completed"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 disabled:opacity-60"
        >
          <Plus size={16} />
          {submitLabel}
        </button>
      </div>

      <textarea
        rows="2"
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(event) =>
          setForm((prev) => ({ ...prev, notes: event.target.value }))
        }
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="space-y-3">
        {(promises || []).map((item) => (
          <div
            key={item._id}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase text-gray-500 dark:text-gray-400">
                  {item.type}
                </p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total: {item.targetAmount} | Completed: {item.completedAmount}{" "}
                  | Remaining: {item.remainingAmount}
                </p>
                {item.notes ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.notes}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() =>
                    setForm({
                      id: item._id,
                      type: item.type,
                      title: item.title,
                      targetAmount: item.targetAmount,
                      completedAmount: item.completedAmount,
                      notes: item.notes || "",
                    })
                  }
                >
                  <PencilLine size={16} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onDelete(item._id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {(!promises || promises.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No promises added yet.
          </p>
        )}
      </div>
    </Card>
  );
};

export default PromiseTracker;
