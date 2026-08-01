import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#a855f7", "#ef4444"];

const TimeAnalytics = ({ overview, charts }) => {
  const productivityData = charts?.time?.productivity30d || [];
  const distribution = charts?.time?.distribution || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Time Tracker Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Today Hours
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {overview?.todayHours || 0}h
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Weekly Hours
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {overview?.weeklyHours || 0}h
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Monthly Hours
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {overview?.monthlyHours || 0}h
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Productivity
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {overview?.productivityPercentage || 0}%
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-300">
            Top Activity
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 line-clamp-2">
            {overview?.mostProductiveActivity?.name || "-"}
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            Last 30 Days Productivity
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="timeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#0284c7"
                  fill="url(#timeArea)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            Time Distribution
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={84}
                >
                  {distribution.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default TimeAnalytics;
