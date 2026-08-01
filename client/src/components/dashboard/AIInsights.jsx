import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Lightbulb } from "lucide-react";

const AIInsights = ({ insights = [] }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <BrainCircuit className="text-cyan-600 dark:text-cyan-400" size={20} />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          LifeOS Intelligence
        </h3>
      </div>

      <div className="mt-4 space-y-2">
        {insights.map((insight, index) => (
          <motion.div
            key={`${insight}-${index}`}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-3 flex gap-2"
          >
            <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {insight}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default AIInsights;
