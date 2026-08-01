import React, { useState, useEffect } from "react";
import Card from "../../components/Card";
import API from "../../utils/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [data, setData] = useState({
    journals: [],
    timeTrackers: [],
    islamic: [],
    calories: [],
    fitness: [],
    habits: [],
    finance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const extractList = (response) => {
    const payload = response?.data;
    return Array.isArray(payload) ? payload : payload?.data || [];
  };

  const fetchDashboardData = async () => {
    try {
      const [
        journals,
        timeTrackers,
        islamic,
        calories,
        fitness,
        habits,
        finance,
      ] = await Promise.all([
        API.get("/journal").catch(() => ({ data: [] })),
        API.get("/time-tracker").catch(() => ({ data: [] })),
        API.get("/islamic").catch(() => ({ data: [] })),
        API.get("/calories").catch(() => ({ data: [] })),
        API.get("/fitness").catch(() => ({ data: [] })),
        API.get("/habits").catch(() => ({ data: [] })),
        API.get("/finance").catch(() => ({ data: [] })),
      ]);

      setData({
        journals: extractList(journals),
        timeTrackers: extractList(timeTrackers),
        islamic: extractList(islamic),
        calories: extractList(calories),
        fitness: extractList(fitness),
        habits: extractList(habits),
        finance: extractList(finance),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const todayCalories = data.calories
    .filter(
      (c) => new Date(c.date).toDateString() === new Date().toDateString(),
    )
    .reduce((sum, c) => sum + c.calories, 0);

  const totalExpenses = data.finance
    .filter((f) => f.type === "expense")
    .reduce((sum, f) => sum + (f.convertedAmountBDT || f.amount || 0), 0);

  const totalIncome = data.finance
    .filter((f) => f.type === "income")
    .reduce((sum, f) => sum + (f.convertedAmountBDT || f.amount || 0), 0);

  const activeHabits = data.habits.filter((h) => h.active !== false);
  const completedHabits = activeHabits.filter(
    (h) => h.completedToday || h.status,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Today's Calories</p>
            <p className="text-3xl font-bold text-blue-500">{todayCalories}</p>
            <p className="text-sm text-gray-500">kcal</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Habits Completed</p>
            <p className="text-3xl font-bold text-green-500">
              {completedHabits}
            </p>
            <p className="text-sm text-gray-500">of {activeHabits.length}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Today's Expenses</p>
            <p className="text-3xl font-bold text-red-500">
              ৳{totalExpenses.toFixed(2)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Total Income</p>
            <p className="text-3xl font-bold text-green-600">
              ৳{totalIncome.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Journals */}
      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Recent Journal Entries
        </h2>
        <div className="space-y-3">
          {data.journals.slice(0, 3).map((journal) => (
            <div
              key={journal._id}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {journal.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {journal.notes?.substring(0, 100)}
              </p>
            </div>
          ))}
          {data.journals.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">
              No journal entries yet
            </p>
          )}
        </div>
      </Card>

      {/* Islamic Tracker Summary */}
      {data.islamic.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Islamic Tracker
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((salah) => {
              const today = data.islamic.find(
                (i) =>
                  new Date(i.date).toDateString() === new Date().toDateString(),
              );
              const completed = today?.salah?.[salah];
              return (
                <div
                  key={salah}
                  className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {salah}
                  </p>
                  <p className="text-2xl">{completed ? "✓" : "○"}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
