import React, { useEffect, useMemo, useState } from "react";
import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import OverviewCards from "../../components/dashboard/OverviewCards";
import TimeAnalytics from "../../components/dashboard/TimeAnalytics";
import StudyAnalytics from "../../components/dashboard/StudyAnalytics";
import IslamicAnalytics from "../../components/dashboard/IslamicAnalytics";
import JournalAnalytics from "../../components/dashboard/JournalAnalytics";
import CaloriesAnalytics from "../../components/dashboard/CaloriesAnalytics";
import FitnessAnalytics from "../../components/dashboard/FitnessAnalytics";
import HabitAnalytics from "../../components/dashboard/HabitAnalytics";
import FinanceAnalytics from "../../components/dashboard/FinanceAnalytics";
import AIInsights from "../../components/dashboard/AIInsights";

const Dashboard = () => {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [currency, setCurrency] = useState("BDT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [rates, setRates] = useState({ USD_BDT: 122, SAR_BDT: 32.5 });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, chartsResponse, ratesResponse] =
        await Promise.all([
          API.get(`/dashboard/overview?range=${range}&currency=${currency}`),
          API.get(`/dashboard/charts?range=${range}&currency=${currency}`),
          API.get("/currency/rates").catch(() => ({ data: {} })),
        ]);

      setOverview(overviewResponse.data?.data || null);
      setCharts(chartsResponse.data?.data || null);

      const ratesData = ratesResponse.data || {};
      if (ratesData.USD_BDT && ratesData.SAR_BDT) {
        setRates(ratesData);
      }
    } catch (requestError) {
      console.error("Failed to load dashboard analytics", requestError);
      setError("Unable to load dashboard analytics right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range, currency]);

  const miniCharts = useMemo(() => {
    if (!charts) {
      return {};
    }

    return {
      productivity: (charts.time?.productivity30d || []).map((point) => ({
        value: point.hours,
      })),
      study: (charts.study?.monthlyLine || []).map((point) => ({
        value: point.hours,
      })),
      islamic: (charts.islamic?.prayerConsistency || []).map((point) => ({
        value: point.percentage,
      })),
      calories: (charts.calories?.weeklyBalance || []).map((point) => ({
        value: point.balance,
      })),
      fitness: (charts.fitness?.caloriesTrend || []).map((point) => ({
        value: point.calories,
      })),
      habits: (charts.habits?.heatmap || []).map((point) => ({
        value: point.completion,
      })),
      finance: (charts.finance?.savingsGrowth || []).map((point) => ({
        value: point.savings,
      })),
      journal: (charts.journal?.moodTrend || []).map((point) => ({
        value: point.moodScore,
      })),
    };
  }, [charts]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:border-rose-700/50 dark:text-rose-200 p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!overview || !charts) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center text-slate-600 dark:text-slate-300">
          No analytics data yet. Start logging your daily activities to unlock
          your full LifeOS dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-b from-slate-100/70 to-transparent dark:from-slate-900/70 min-h-full">
      <DashboardHeader
        userName={user?.username}
        greeting={overview.greeting}
        lifeScore={overview.lifeScore}
        motivation={overview.motivation}
        range={range}
        onRangeChange={setRange}
        currency={currency}
        onCurrencyChange={setCurrency}
        currencyRates={rates}
      />

      <OverviewCards cards={overview.overviewCards} charts={miniCharts} />

      <TimeAnalytics overview={overview.productivity} charts={charts} />
      <StudyAnalytics overview={overview.study} charts={charts} />
      <IslamicAnalytics overview={overview.islamic} charts={charts} />
      <JournalAnalytics
        overview={overview.journal}
        charts={charts}
        entries={overview.journal?.recentEntries || []}
      />
      <CaloriesAnalytics overview={overview.calories} charts={charts} />
      <FitnessAnalytics overview={overview.fitness} charts={charts} />
      <HabitAnalytics overview={overview.habits} charts={charts} />
      <FinanceAnalytics overview={overview.finance} charts={charts} />
      <AIInsights insights={overview.insights || []} />
    </div>
  );
};

export default Dashboard;
