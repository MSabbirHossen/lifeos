import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import OverviewCards from "../../components/dashboard/OverviewCards";
import AIInsights from "../../components/dashboard/AIInsights";
import LifeBalanceRadar from "../../components/dashboard/LifeBalanceRadar";

const TimeAnalytics = lazy(
  () => import("../../components/dashboard/TimeAnalytics"),
);
const StudyAnalytics = lazy(
  () => import("../../components/dashboard/StudyAnalytics"),
);
const IslamicAnalytics = lazy(
  () => import("../../components/dashboard/IslamicAnalytics"),
);
const JournalAnalytics = lazy(
  () => import("../../components/dashboard/JournalAnalytics"),
);
const CaloriesAnalytics = lazy(
  () => import("../../components/dashboard/CaloriesAnalytics"),
);
const FitnessAnalytics = lazy(
  () => import("../../components/dashboard/FitnessAnalytics"),
);
const HabitAnalytics = lazy(
  () => import("../../components/dashboard/HabitAnalytics"),
);
const FinanceAnalytics = lazy(
  () => import("../../components/dashboard/FinanceAnalytics"),
);

const SectionSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-5 animate-pulse">
    <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
    <div className="mt-3 h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
  </div>
);

const EmptyState = ({ actions = [] }) => (
  <div className="rounded-2xl border border-dashed border-cyan-300 dark:border-cyan-700 bg-white/80 dark:bg-slate-800/80 p-5">
    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
      Start building your LifeOS
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
      Complete these milestones to unlock your personal command center.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {actions.map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 text-sm text-slate-700 dark:text-slate-200"
        >
          {item}
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [currency, setCurrency] = useState("BDT");
  const [comparePrevious, setComparePrevious] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await API.get(
        `/dashboard?range=${range}&currency=${currency}&comparePrevious=${comparePrevious}`,
      );
      setDashboard(data?.data || null);
    } catch (requestError) {
      console.error("Failed to load dashboard analytics", requestError);
      setError("Unable to load dashboard analytics right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range, currency, comparePrevious]);

  const miniCharts = useMemo(() => {
    if (!dashboard?.charts) {
      return {};
    }

    const charts = dashboard.charts;
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
  }, [dashboard]);

  const handleExportJson = () => {
    if (!dashboard) return;
    const blob = new Blob([JSON.stringify(dashboard, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lifeos-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPdf = () => {
    if (!dashboard?.overview) return;

    const pdf = new jsPDF();
    const { overview } = dashboard;

    pdf.setFontSize(16);
    pdf.text("LifeOS Dashboard Report", 14, 16);

    pdf.setFontSize(11);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
    pdf.text(`User: ${user?.username || "User"}`, 14, 30);

    pdf.setFontSize(12);
    pdf.text(
      `Life Score: ${overview.lifeScore?.score || 0} (${overview.lifeScore?.category || "-"})`,
      14,
      40,
    );
    pdf.text(`Message: ${overview.lifeScore?.message || ""}`, 14, 46);

    const lines = [
      `Productivity: ${overview.productivity?.totalHours || 0}h (${overview.productivity?.productivityPercentage || 0}%)`,
      `Study: ${overview.study?.totalHours || 0}h | Streak: ${overview.study?.currentStreak || 0}d`,
      `Islamic: ${overview.islamic?.consistencyScore || 0}% | Quran: ${overview.islamic?.quranPages || 0} pages`,
      `Calories: ${overview.calories?.netCalories || 0} (${overview.calories?.status || "-"})`,
      `Fitness: ${overview.fitness?.totalWorkouts || 0} workouts`,
      `Habits: ${overview.habits?.completionRate || 0}%`,
      `Finance: ${overview.finance?.currency || "BDT"} ${overview.finance?.balance || 0}`,
      `Journal: ${overview.journal?.entries || 0} entries | Streak: ${overview.journal?.writingStreak || 0}d`,
    ];

    pdf.setFontSize(10);
    lines.forEach((line, index) => {
      pdf.text(line, 14, 58 + index * 6);
    });

    const insightLines = (dashboard.insights || [])
      .slice(0, 6)
      .map((item) => `- ${typeof item === "string" ? item : item.text}`);

    pdf.setFontSize(12);
    pdf.text("AI Insights", 14, 114);
    pdf.setFontSize(10);
    insightLines.forEach((line, index) => {
      pdf.text(line, 14, 121 + index * 6);
    });

    pdf.save(`lifeos-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 animate-pulse">
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
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

  if (!dashboard || !dashboard.overview || !dashboard.charts) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center text-slate-600 dark:text-slate-300">
          No analytics data yet. Start logging your daily activities to unlock
          your full LifeOS dashboard.
        </div>
      </div>
    );
  }

  const { overview, charts } = dashboard;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 bg-gradient-to-b from-slate-100/70 to-transparent dark:from-slate-900/70 min-h-full overflow-x-hidden">
      <DashboardHeader
        userName={user?.username}
        greeting={overview.greeting}
        lifeScore={overview.lifeScore?.score}
        motivation={overview.motivation}
        range={range}
        onRangeChange={setRange}
        currency={currency}
        onCurrencyChange={setCurrency}
        currencyRates={dashboard.rates}
        streakSummary={overview.streakSummary}
        comparePrevious={comparePrevious}
        onComparePreviousChange={setComparePrevious}
        onExportJson={handleExportJson}
        onExportPdf={handleExportPdf}
      />

      {overview.comparison?.enabled && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-800/85 backdrop-blur p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Comparison (Current vs Previous)
          </h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <ComparisonItem title="Study" data={overview.comparison.study} />
            <ComparisonItem
              title="Productivity"
              data={overview.comparison.productivity}
            />
            <ComparisonItem
              title="Fitness"
              data={overview.comparison.fitness}
            />
            <ComparisonItem
              title="Finance Expense"
              data={overview.comparison.finance}
            />
          </div>
        </div>
      )}

      {!dashboard.hasAnyData && (
        <EmptyState actions={dashboard.emptyState?.actions || []} />
      )}

      <OverviewCards cards={overview.overviewCards} charts={miniCharts} />
      <LifeBalanceRadar data={charts.radarBalance || []} />

      <Suspense fallback={<SectionSkeleton />}>
        <TimeAnalytics overview={overview.productivity} charts={charts} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <StudyAnalytics overview={overview.study} charts={charts} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <IslamicAnalytics overview={overview.islamic} charts={charts} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <JournalAnalytics
          overview={overview.journal}
          charts={charts}
          entries={overview.journal?.recentEntries || []}
        />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CaloriesAnalytics overview={overview.calories} charts={charts} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FitnessAnalytics overview={overview.fitness} charts={charts} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <HabitAnalytics overview={overview.habits} charts={charts} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FinanceAnalytics overview={overview.finance} charts={charts} />
      </Suspense>

      <AIInsights insights={dashboard.insights || []} />
    </div>
  );
};

const ComparisonItem = ({ title, data }) => {
  if (!data) return null;

  const change = Number(data.change || 0);
  const colorClass =
    change >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
      <p className="text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
        {title}
      </p>
      <p className="text-slate-900 dark:text-white font-semibold mt-1">
        {data.current}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-300">
        Previous: {data.previous}
      </p>
      <p className={`text-xs font-medium mt-1 ${colorClass}`}>
        {change >= 0 ? "+" : ""}
        {change.toFixed(1)}%
      </p>
    </div>
  );
};

export default Dashboard;
