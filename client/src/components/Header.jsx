import React, { useState } from "react";
import { Menu } from "lucide-react";

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-20">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Personal Life OS
        </h1>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
      </div>
    </header>
  );
};

export default Header;
