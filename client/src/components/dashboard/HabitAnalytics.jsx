import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const HabitAnalytics = ({ overview, charts }) => {
  const heatmap = charts?.habits?.heatmap || [];
  const individualProgress = charts?.habits?.individualProgress || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Habit Tracker Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Completed
          </p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {overview?.completionRate || 0}%
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Incomplete{" "}
            {overview?.incomplete ??
              Math.max(0, 100 - Number(overview?.completionRate || 0))}
            %
          </p>
        </div>
        <Stat
          label="Strongest Habit"
          value={
            overview?.bestHabit
              ? `${overview.bestHabit.name} (${overview.bestHabit.completionRate}%)`
              : "-"
          }
        />
        <Stat
          label="Weakest Habit / Longest Streak"
          value={
            overview?.worstHabit
              ? `${overview.worstHabit.name} (${overview.worstHabit.completionRate}%) | ${overview.longestStreak || 0}d`
              : `${overview?.longestStreak || 0}d`
          }
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Daily Completion Heatmap" className="xl:col-span-2">
          <div className="grid grid-cols-10 gap-1.5 pt-2">
            {heatmap.slice(-30).map((cell) => {
              const opacity = Math.max(
                0.15,
                Number(cell.completion || 0) / 100,
              );
              return (
                <div key={cell.date} className="space-y-1">
                  <div
                    title={`${cell.date}: ${cell.completion}%`}
                    className="h-7 rounded"
                    style={{
                      backgroundColor: `rgba(16, 185, 129, ${opacity})`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Habit Streak Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={heatmap}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Individual Habit Progress" className="xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={individualProgress}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="completion" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.section>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
    <p className="text-xs text-slate-500 dark:text-slate-300">{label}</p>
    <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
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

export default HabitAnalytics;
