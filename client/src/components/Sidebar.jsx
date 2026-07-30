import React from "react";
import { Link } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/journal", label: "Journal", icon: "📔" },
    { path: "/time-tracker", label: "Time Tracker", icon: "⏱️" },
    { path: "/study", label: "Study", icon: "📚" },
    { path: "/islamic", label: "Islamic", icon: "📿" },
    { path: "/calories", label: "Calories", icon: "🍎" },
    { path: "/fitness", label: "Fitness", icon: "💪" },
    { path: "/habits", label: "Habits", icon: "✅" },
    { path: "/finance", label: "Finance", icon: "💰" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:w-64 overflow-y-auto`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">Life OS</h1>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition"
                onClick={() => isOpen && toggleSidebar()}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 pt-8 border-t border-gray-700 space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition w-full"
            >
              {theme === "light" ? (
                <>
                  <Moon size={20} />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun size={20} />
                  <span>Light Mode</span>
                </>
              )}
            </button>
            <button
              onClick={logout}
              className="w-full p-3 bg-red-600 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
