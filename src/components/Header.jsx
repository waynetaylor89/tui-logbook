import PropTypes from "prop-types";
import { memo } from "react";
import { AVIATION_COLORS } from "../config/logbookConfig.js";

const APP_BUILD = typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "01";

const Header = memo(function Header({ fleetCount, currentUser, isAdmin, onLogout, darkMode }) {
  return (
    <div className="rounded-2xl shadow-lg p-4 sm:p-5 border border-cyan-900/60 bg-slate-900/85 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Airport Operations Interface</div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h1 className="max-w-full text-xl font-bold leading-tight sm:text-2xl" style={{ color: AVIATION_COLORS.accent }}>
            TUI Aircraft Logbook
          </h1>
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 sm:text-xs">
            Build {APP_BUILD}
          </span>
        </div>

        <div className="text-sm mt-1 text-slate-300">
          {fleetCount} aircraft loaded
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:justify-end">
        <div className="text-xs sm:text-sm font-medium rounded-full px-3 py-1 border text-cyan-100 border-cyan-900/70 bg-slate-950/70">
          Operator: {currentUser} {isAdmin && "(Admin)"}
        </div>
        <div className="text-xs sm:text-sm font-medium rounded-full px-3 py-1 border text-cyan-100 border-cyan-900/70 bg-slate-950/70">
          {new Date().toLocaleTimeString()}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-white px-3 py-1 rounded hover:opacity-90 text-sm"
            style={{ backgroundColor: AVIATION_COLORS.danger }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
});

Header.propTypes = {
  fleetCount: PropTypes.number.isRequired,
  currentUser: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onLogout: PropTypes.func,
  darkMode: PropTypes.bool,
};

export default Header;