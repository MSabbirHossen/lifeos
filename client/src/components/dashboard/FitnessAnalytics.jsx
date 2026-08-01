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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#8b5cf6", "#ef4444"];

const FitnessAnalytics = ({ overview, charts }) => {
  const frequency = charts?.fitness?.workoutFrequency || [];
  const caloriesTrend = charts?.fitness?.caloriesTrend || [];
  const categoryDistribution = charts?.fitness?.categoryDistribution || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Fitness Tracker Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <Stat label="Total Workouts" value={overview?.totalWorkouts || 0} />
        <Stat label="Duration" value={`${overview?.totalMinutes || 0} min`} />
        <Stat label="Calories Burned" value={overview?.caloriesBurned || 0} />
        <Stat
          label="Consistency"
          value={`${overview?.workoutConsistency || 0}%`}
        />
        <Stat
          label="Muscle Groups"
          value={overview?.muscleGroupFrequency?.length || 0}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Workout Frequency">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={frequency}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="workouts" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Calories Burned Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={caloriesTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Exercise Categories">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={84}
              >
                {categoryDistribution.map((item, idx) => (
                  <Cell key={item.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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

export default FitnessAnalytics;
