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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

const StudyAnalytics = ({ overview, charts }) => {
  const weeklyBars = charts?.study?.weeklyBars || [];
  const subjectDistribution = charts?.study?.subjectDistribution || [];
  const monthlyLine = charts?.study?.monthlyLine || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Study Tracker Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <Stat label="Total Study" value={`${overview?.totalHours || 0}h`} />
        <Stat
          label="Subjects"
          value={overview?.subjectDistribution?.length || 0}
        />
        <Stat label="Streak" value={`${overview?.currentStreak || 0} days`} />
        <Stat
          label="Consistency"
          value={`${overview?.weeklyConsistency || 0}%`}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Weekly Study Hours" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyBars}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subject Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={84}
              >
                {subjectDistribution.map((item, idx) => (
                  <Cell key={item.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Progress" className="xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyLine}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#0ea5e9"
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

export default StudyAnalytics;
