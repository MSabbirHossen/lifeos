import React from "react";
import { RefreshCcw, Sparkles } from "lucide-react";

const ReflectionPrompt = ({
  question,
  category,
  loading,
  error,
  onRefresh,
  disabled = false,
}) => {
  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-indigo-100/60 dark:hover:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Sparkles size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Today&apos;s Reflection
            </h3>
          </div>
          {category && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-200">
              Category: {category}
            </span>
          )}
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loading reflection question...
            </p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <>
              <p className="text-base md:text-lg font-medium text-gray-900 dark:text-white">
                &quot;{question}&quot;
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Take a few minutes and answer honestly.
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={disabled || loading}
          className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 hover:bg-white dark:hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCcw size={14} /> New Question
        </button>
      </div>
    </div>
  );
};

export default ReflectionPrompt;
