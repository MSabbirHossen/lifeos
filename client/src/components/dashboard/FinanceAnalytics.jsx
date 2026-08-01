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

const COLORS = ["#0ea5e9", "#f97316", "#22c55e", "#8b5cf6", "#ef4444"];

const FinanceAnalytics = ({ overview, charts }) => {
  const incomeVsExpense = charts?.finance?.incomeVsExpense || [];
  const monthlySpending = charts?.finance?.monthlySpending || [];
  const categorySpending = charts?.finance?.categorySpending || [];
  const savingsGrowth = charts?.finance?.savingsGrowth || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Finance Tracker Summary
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {overview?.summary}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <Stat
          label="Income"
          value={`${overview?.currency || "BDT"} ${Number(overview?.income || 0).toFixed(2)}`}
        />
        <Stat
          label="Expense"
          value={`${overview?.currency || "BDT"} ${Number(overview?.expense || 0).toFixed(2)}`}
        />
        <Stat
          label="Savings"
          value={`${overview?.currency || "BDT"} ${Number(overview?.savings || 0).toFixed(2)}`}
        />
        <Stat
          label="Balance"
          value={`${overview?.currency || "BDT"} ${Number(overview?.balance || 0).toFixed(2)}`}
        />
        <Stat label="Savings Rate" value={`${overview?.savingsRate || 0}%`} />
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <ChartCard title="Income vs Expense Bar" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Spending Pie">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categorySpending}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={84}
              >
                {categorySpending.map((item, idx) => (
                  <Cell key={item.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Spending Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Savings Growth" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={savingsGrowth}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#22c55e"
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

export default FinanceAnalytics;
