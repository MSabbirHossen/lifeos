import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";

const CaloriesAnalytics = ({ overview, charts }) => {
  const consumedVsBurned = charts?.calories?.consumedVsBurned || [];
  const weeklyBalance = charts?.calories?.weeklyBalance || [];
  const weightProgress = charts?.calories?.weightProgress || [];

  const isSurplus = Number(overview?.netCalories || 0) > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Calories Tracker Summary
      </h3>

      <div
        className={`mt-4 rounded-2xl p-4 border ${isSurplus ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700/40" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/40"}`}
      >
        <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Calorie Balance
        </p>
        <p
          className={`text-3xl font-bold mt-1 ${isSurplus ? "text-rose-600 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}
        >
          {overview?.netCalories > 0 ? "+" : ""}
          {Number(overview?.netCalories || 0).toFixed(0)} kcal{" "}
          {overview?.status}
        </p>
        <p className="text-sm mt-2 text-slate-700 dark:text-slate-200">
          {overview?.message}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Stat
          label="Consumed"
          value={`${overview?.consumedCalories || 0} kcal`}
        />
        <Stat label="Burned" value={`${overview?.burnedCalories || 0} kcal`} />
        <Stat
          label="Weekly Avg Balance"
          value={`${overview?.weeklyAverageBalance || 0} kcal`}
        />
        <Stat
          label="Weight Prediction"
          value={
            overview?.weightTrendPrediction
              ? `${overview.weightTrendPrediction.trend} (${overview.weightTrendPrediction.predicted7DayChange} /7d)`
              : "-"
          }
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard
          title="Calories Consumed vs Burned"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consumedVsBurned}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="burned" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Calorie Balance">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyBalance}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={isSurplus ? "#ef4444" : "#16a34a"}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weight Progress" className="xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightProgress}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.section>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
    <p className="text-xs text-slate-500 dark:text-slate-300">{label}</p>
    <p className="text-xl font-semibold text-slate-900 dark:text-white">
      {value}
    </p>
  </div>
);

const ChartCard = ({ title, children, className = "" }) => (
  <div
    className={`rounded-xl border border-slate-200 dark:border-slate-700 p-3 ${className}`}
  >
    <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
      {title}
    </p>
    <div className="h-64">{children}</div>
  </div>
);

export default CaloriesAnalytics;
