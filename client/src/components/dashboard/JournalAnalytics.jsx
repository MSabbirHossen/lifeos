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

const JournalAnalytics = ({ overview, charts, entries = [] }) => {
  const moodTrend = charts?.journal?.moodTrend || [];

  const topicMap = entries.reduce((acc, entry) => {
    const topics = Array.isArray(entry.activities) ? entry.activities : [];
    topics.forEach((topic) => {
      if (!topic) return;
      acc[topic] = (acc[topic] || 0) + 1;
    });
    return acc;
  }, {});

  const topicData = Object.entries(topicMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Journal Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Stat label="Entries" value={overview?.totalEntries || 0} />
        <Stat
          label="Writing Streak"
          value={`${overview?.writingStreak || 0} days`}
        />
        <Stat label="Mood Score" value={`${overview?.moodScore || 0}%`} />
        <Stat label="Avg Words/Day" value={overview?.averageWordsPerDay || 0} />
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Mood Trend" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="moodScore"
                stroke="#eab308"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Used Topics">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={70}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
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

export default JournalAnalytics;
