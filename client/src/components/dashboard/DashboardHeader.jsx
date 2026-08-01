import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, Sparkles } from "lucide-react";

const rangeLabels = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
  year: "Year",
};

const DashboardHeader = ({
  userName,
  greeting,
  lifeScore,
  motivation,
  range,
  onRangeChange,
  currency,
  onCurrencyChange,
  currencyRates,
}) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, Number(lifeScore || 0)));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-gradient-to-r from-cyan-100 via-sky-50 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-5 md:p-6 shadow-sm"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] items-center">
        <div className="space-y-3">
          <p className="text-slate-500 dark:text-slate-300 flex items-center gap-2 text-sm">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {userName || "Friend"}
          </h1>

          <p className="text-slate-700 dark:text-slate-200 text-sm md:text-base">
            <span className="font-medium">
              Your Life Score Today: {progress}%
            </span>
            <span className="block mt-1">{motivation}</span>
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <label className="text-sm text-slate-700 dark:text-slate-200">
              <span className="mr-2">Range</span>
              <select
                value={range}
                onChange={(e) => onRangeChange(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-sm"
              >
                {Object.entries(rangeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-700 dark:text-slate-200">
              <span className="mr-2">Currency</span>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-sm"
              >
                <option value="BDT">BDT</option>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            1 SAR = {Number(currencyRates?.SAR_BDT || 0).toFixed(2)} BDT | 1 USD
            = {Number(currencyRates?.USD_BDT || 0).toFixed(2)} BDT
          </p>
        </div>

        <div className="justify-self-center lg:justify-self-end">
          <div className="relative h-36 w-36">
            <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="70"
                cy="70"
                r={radius}
                stroke="url(#lifeScoreGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                strokeDasharray={circumference}
              />
              <defs>
                <linearGradient
                  id="lifeScoreGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <Sparkles className="text-amber-500" size={18} />
              <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">
                {progress}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Life Score
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DashboardHeader;
