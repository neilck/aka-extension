import React from "react";

function AppBar() {
  return (
    <nav className="bg-white dark:bg-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto h-10 px-4 py-2">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div className="flex items-center">
              <img src="logo.svg" alt="Logo" className="h-4 w-4 mr-2" />
              <span className="text-slate-900 dark:text-white font-semibold text-lg">
                AKA Profiles Options
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default AppBar;
