import React, { useEffect, useState } from "react";
import API from "../../utils/api";
import IslamicDashboard from "./components/IslamicDashboard";
import SalahBacklog from "./components/SalahBacklog";
import SalahTracker from "./components/SalahTracker";
import SalahAnalytics from "./components/SalahAnalytics";
import IslamicCalendar from "./components/IslamicCalendar";
import PromiseTracker from "./components/PromiseTracker";
import { createDefaultDayForm, normalizeTrackerForm } from "./islamicUtils";

const Islamic = () => {
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState(false);
  const [savingBacklog, setSavingBacklog] = useState(false);
  const [savingPromise, setSavingPromise] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    today: null,
    backlog: {
      totalDays: 0,
      completedDays: 0,
      remainingDays: 0,
      progressPercentage: 0,
      startDate: null,
      notes: "",
      wasFastingOnStartDate: false,
    },
    currentStreak: 0,
    locationDistribution: [],
    calendar: [],
    promises: [],
  });

  const [dayForm, setDayForm] = useState(createDefaultDayForm());

  const fetchSummary = async () => {
    try {
      const response = await API.get("/islamic/summary");
      const payload = response?.data?.data || {};
      setSummary((prev) => ({
        ...prev,
        ...payload,
      }));
      setDayForm(normalizeTrackerForm(payload.today));
      setError("");
    } catch (requestError) {
      setError("Unable to load Islamic tracker data right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const saveToday = async () => {
    try {
      setSavingDay(true);
      await API.post("/islamic", dayForm);
      await fetchSummary();
    } catch (requestError) {
      setError("Unable to save today's salah entry.");
    } finally {
      setSavingDay(false);
    }
  };

  const saveBacklog = async (payload) => {
    try {
      setSavingBacklog(true);
      await API.put("/islamic/backlog", payload);
      await fetchSummary();
    } catch (requestError) {
      setError("Unable to save backlog setup.");
    } finally {
      setSavingBacklog(false);
    }
  };

  const createPromise = async (payload) => {
    try {
      setSavingPromise(true);
      await API.post("/islamic/promises", payload);
      await fetchSummary();
    } catch (requestError) {
      setError("Unable to add promise.");
    } finally {
      setSavingPromise(false);
    }
  };

  const updatePromise = async (id, payload) => {
    try {
      setSavingPromise(true);
      await API.put(`/islamic/promises/${id}`, payload);
      await fetchSummary();
    } catch (requestError) {
      setError("Unable to update promise.");
    } finally {
      setSavingPromise(false);
    }
  };

  const deletePromise = async (id) => {
    try {
      setSavingPromise(true);
      await API.delete(`/islamic/promises/${id}`);
      await fetchSummary();
    } catch (requestError) {
      setError("Unable to delete promise.");
    } finally {
      setSavingPromise(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-600 dark:text-gray-300">
        Loading Islamic tracker...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 border border-emerald-200/60 dark:border-gray-600">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Salah & Islamic Commitment Tracker
        </h1>
        <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
          Track daily salah, recover missed salah backlog, and keep promises
          visible.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <IslamicDashboard
        backlog={summary.backlog || {}}
        currentStreak={summary.currentStreak || 0}
      />

      <SalahBacklog
        backlog={summary.backlog || {}}
        onSave={saveBacklog}
        saving={savingBacklog}
      />

      <SalahTracker
        value={dayForm}
        onChange={setDayForm}
        onSubmit={saveToday}
        saving={savingDay}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <IslamicCalendar calendar={summary.calendar || []} />
        <SalahAnalytics data={summary.locationDistribution || []} />
      </div>

      <PromiseTracker
        promises={summary.promises || []}
        onCreate={createPromise}
        onUpdate={updatePromise}
        onDelete={deletePromise}
        saving={savingPromise}
      />
    </div>
  );
};

export default Islamic;
