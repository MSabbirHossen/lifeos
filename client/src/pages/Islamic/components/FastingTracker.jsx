import React from "react";
import { FASTING_TYPES } from "../islamicUtils";

const FastingTracker = ({ fasting, fastingType, onChange }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Fasting Today?
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="radio"
            checked={fasting}
            onChange={() => onChange({ fasting: true })}
          />
          Yes
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="radio"
            checked={!fasting}
            onChange={() => onChange({ fasting: false })}
          />
          No
        </label>
      </div>

      {fasting && (
        <div>
          <label
            htmlFor="fasting-type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Fasting Type
          </label>
          <select
            id="fasting-type"
            value={fastingType}
            onChange={(event) => onChange({ fastingType: event.target.value })}
            className="w-full md:w-80 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            {FASTING_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default FastingTracker;
