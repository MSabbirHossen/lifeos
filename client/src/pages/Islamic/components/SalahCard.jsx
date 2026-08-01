import React from "react";
import { SALAH_LOCATIONS, SALAH_LABELS } from "../islamicUtils";

const acts = [
  { key: "sunnah", label: "Sunnah" },
  { key: "nafal", label: "Nafal" },
  { key: "mustahab", label: "Mustahab" },
  { key: "dukhulMasjid", label: "Dukhulul Masjid" },
  { key: "tahiyyatulWudu", label: "Tahiyyatul Wudu" },
];

const SalahCard = ({ name, value, onChange }) => {
  const label = SALAH_LABELS[name] || name;

  const update = (patch) => {
    onChange(name, { ...value, ...patch });
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white/90 dark:bg-gray-800/70">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {label}
      </h3>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Status
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="radio"
              name={`${name}-status`}
              checked={value.status === "PERFORMED"}
              onChange={() => update({ status: "PERFORMED" })}
            />
            Performed
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="radio"
              name={`${name}-status`}
              checked={value.status === "MISSED"}
              onChange={() => update({ status: "MISSED" })}
            />
            Missed
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Location
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SALAH_LOCATIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="radio"
                name={`${name}-location`}
                checked={value.location === option.value}
                onChange={() => update({ location: option.value })}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Acts
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {acts.map((act) => (
            <label
              key={act.key}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                checked={Boolean(value[act.key])}
                onChange={(event) =>
                  update({ [act.key]: event.target.checked })
                }
              />
              {act.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${name}-notes`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          id={`${name}-notes`}
          rows="2"
          value={value.notes || ""}
          onChange={(event) => update({ notes: event.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
};

export default SalahCard;
