import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Journal from "./pages/Journal/Journal";
import TimeTracker from "./pages/TimeTracker/TimeTracker";
import Study from "./pages/Study/Study";
import Islamic from "./pages/Islamic/Islamic";
import Calories from "./pages/Calories/Calories";
import Fitness from "./pages/Fitness/Fitness";
import Habits from "./pages/Habits/Habits";
import Finance from "./pages/Finance/Finance";
import Settings from "./pages/Settings/Settings";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const MainApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/time-tracker" element={<TimeTracker />} />
            <Route path="/study" element={<Study />} />
            <Route path="/islamic" element={<Islamic />} />
            <Route path="/calories" element={<Calories />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
