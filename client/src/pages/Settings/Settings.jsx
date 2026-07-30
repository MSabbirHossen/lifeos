import React from "react";
import Card from "../../components/Card";

const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Account Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          About
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          <strong>Personal Life OS</strong> v1.0.0
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          A comprehensive personal life management system combining journaling,
          time tracking, and various health/productivity trackers.
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Developed by Part-time Coder
        </p>
      </Card>
    </div>
  );
};

export default Settings;
