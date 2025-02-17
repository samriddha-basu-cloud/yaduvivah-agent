import { useState } from "react";

export default function SubHeaderNav({ activeTab, setActiveTab }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center overflow-x-auto hide-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`inline-flex items-center px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap
                ${activeTab === item.key
                  ? "border-white text-white"
                  : "border-transparent text-white hover:text-gray-200 hover:border-gray-300"
                }
                transition-colors duration-200`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}