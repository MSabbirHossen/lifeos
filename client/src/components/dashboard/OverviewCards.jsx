import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  MoonStar,
  Flame,
  Dumbbell,
  CheckCircle2,
  Wallet,
  Smile,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const iconMap = {
  productivity: Activity,
  study: BookOpen,
  islamic: MoonStar,
  calories: Flame,
  fitness: Dumbbell,
  habits: CheckCircle2,
  finance: Wallet,
  journal: Smile,
};

const OverviewCards = ({ cards = [], charts = {} }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
          Global Analytics
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = iconMap[card.key] || Activity;
          const deltaPositive = Number(card.delta || 0) >= 0;
          const miniData = charts?.[card.key] || [];

          return (
            <motion.article
              key={card.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/95 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {card.label}
                  </p>
                  <p className="text-2xl font-semibold mt-1 text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <span className="rounded-xl p-2 bg-sky-50 dark:bg-slate-700 text-sky-600 dark:text-sky-300">
                  <Icon size={18} />
                </span>
              </div>

              <div className="mt-3 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniData}>
                    <Tooltip
                      formatter={(value) => [value, "value"]}
                      contentStyle={{ borderRadius: 10, border: "none" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={deltaPositive ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <p className="text-slate-600 dark:text-slate-300">
                  {card.status}
                </p>
                <p
                  className={`inline-flex items-center gap-1 font-medium ${
                    deltaPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {deltaPositive ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {Math.abs(Number(card.delta || 0)).toFixed(1)}%
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default OverviewCards;
