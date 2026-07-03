import { NavLink, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import Header from "../components/Header.jsx";
import { AVIATION_COLORS } from "../config/logbookConfig.js";

const navClass = ({ isActive }) => {
  const baseClasses = "px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 border";
  if (isActive) {
    return `${baseClasses} text-cyan-100 shadow-md border-cyan-300/60 bg-gradient-to-r from-cyan-700/80 to-blue-700/80`;
  }
  return `${baseClasses} text-cyan-100 border-cyan-900/70 bg-slate-950/75 hover:bg-slate-900/90`;
};

export default function AppShell({ fleetCount, currentUser, isAdmin, onLogout, darkMode }) {
  const shellTheme = "from-slate-950 via-slate-900 to-cyan-950";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${shellTheme} ops-grid-bg`}>
      <div className="min-h-screen p-3 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 rounded-3xl border border-cyan-900/60 bg-slate-950/55 p-3 sm:p-4 lg:p-6 backdrop-blur-sm shadow-[0_0_35px_rgba(6,182,212,0.15)]">
          {/* Mobile Navigation */}
          <div className="lg:hidden rounded-2xl shadow-lg p-4 border bg-slate-900/85 border-cyan-900/60">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h1 className="text-lg font-bold" style={{ color: AVIATION_COLORS.accent }}>TUI Logbook</h1>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <NavLink to="/" end className={navClass}>
                Home
              </NavLink>
              <NavLink to="/movements" className={navClass}>
                Aircraft Movements
              </NavLink>
              <NavLink to="/records" className={navClass}>
                Movement Records
              </NavLink>
              {isAdmin && (
                <NavLink to="/users" className={navClass}>
                  Manage Users
                </NavLink>
              )}
              <NavLink to="/settings" className={navClass}>
                Settings
              </NavLink>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex rounded-2xl shadow-lg p-4 flex-wrap items-center justify-between gap-3 border bg-slate-900/85 backdrop-blur-sm border-cyan-900/60">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Operations Navigation</div>
            <div className="flex flex-wrap gap-2">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/movements" className={navClass}>
              Aircraft Movements
            </NavLink>
            <NavLink to="/records" className={navClass}>
              Movement Records
            </NavLink>
            {isAdmin && (
              <NavLink to="/users" className={navClass}>
                Manage Users
              </NavLink>
            )}
            <NavLink to="/settings" className={navClass}>
              Settings
            </NavLink>
            </div>
          </div>
          <Header fleetCount={fleetCount} currentUser={currentUser} isAdmin={isAdmin} onLogout={onLogout} />
          <div className="rounded-2xl border border-cyan-900/60 bg-slate-900/80 p-4 shadow-xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

AppShell.propTypes = {
  fleetCount: PropTypes.number.isRequired,
  currentUser: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onLogout: PropTypes.func,
  darkMode: PropTypes.bool,
};
