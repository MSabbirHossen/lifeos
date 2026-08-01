import React from "react";
import Card from "../../../components/Card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#0f766e", "#2563eb", "#ea580c", "#be123c", "#7c3aed", "#16a34a"];

const WorkoutChart = ({ monthlyTotals, muscleDistribution }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2 border border-gray-100 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-3">Monthly Workout Calories</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calories" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="border border-gray-100 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-3">Muscle Focus Mix</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={muscleDistribution.slice(0, 6)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {muscleDistribution.slice(0, 6).map((item, index) => (
                  <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default WorkoutChart;
