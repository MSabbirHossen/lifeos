import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

const LifeBalanceRadar = ({ data = [] }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 md:p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Life Balance Radar
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        Balance across Islamic, Study, Health, Fitness, Finance, Habits, and
        Productivity.
      </p>
      <div className="h-72 sm:h-80 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid strokeOpacity={0.4} />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis
              angle={24}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Radar
              name="Life Balance"
              dataKey="value"
              stroke="#0891b2"
              fill="#0891b2"
              fillOpacity={0.35}
              isAnimationActive
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
};

export default LifeBalanceRadar;
