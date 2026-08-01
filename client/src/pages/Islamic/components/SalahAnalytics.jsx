import React from "react";
import Card from "../../../components/Card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const locationLabels = {
  MASJID_CONGREGATION: "Masjid + Congregation",
  MASJID_ALONE: "Masjid Alone",
  ROOM_ALONE: "Room Alone",
  HOME_CONGREGATION: "Home Congregation",
};

const SalahAnalytics = ({ data = [] }) => {
  const chartData = data.map((row) => ({
    ...row,
    label: locationLabels[row.location] || row.location,
  }));

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Salah Performance Location
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 Days</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 20, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis type="category" dataKey="label" width={150} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="percentage" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {chartData.map((row) => (
          <div
            key={row.location}
            className="text-sm text-gray-700 dark:text-gray-300 flex justify-between"
          >
            <span>{row.label}</span>
            <span className="font-semibold">{row.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SalahAnalytics;
