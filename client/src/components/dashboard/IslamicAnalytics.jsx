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
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const IslamicAnalytics = ({ overview, charts }) => {
  const prayerData = charts?.islamic?.prayerConsistency || [];
  const quranData = charts?.islamic?.quranPages || [];
  const timeline = charts?.islamic?.timeline || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Islamic Tracker Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Stat
          label="Salah Completion"
          value={`${overview?.prayerScore || 0}%`}
        />
        <Stat label="Quran Pages" value={overview?.quranPages || 0} />
        <Stat
          label="Quran Streak"
          value={`${overview?.quranStreak || 0} days`}
        />
        <Stat label="Islamic Lessons" value={overview?.islamicLessons || 0} />
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {prayers.map((prayer, idx) => (
          <div
            key={prayer}
            className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-2 text-center"
          >
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {prayer}
            </p>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-1">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{
                  width: `${Math.max(10, Math.min(100, Number(overview?.prayerScore || 0) - idx * 4))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Weekly Prayer Consistency">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prayerData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Quran Pages/Month">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={quranData}>
              <defs>
                <linearGradient id="quranGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="pages"
                stroke="#16a34a"
                fill="url(#quranGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Islamic Activity Timeline">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="prayers" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quranPages" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
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

const ChartCard = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
    <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
      {title}
    </p>
    <div className="h-64">{children}</div>
  </div>
);

export default IslamicAnalytics;
