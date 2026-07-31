import PropTypes from "prop-types";
import { memo } from "react";
import { AVIATION_COLORS } from "../config/logbookConfig.js";

const APP_BUILD = typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "0";
const APP_REVISION = typeof __APP_REVISION__ !== "undefined" ? __APP_REVISION__ : "local";

const Header = memo(function Header({ fleetCount, currentUser, isAdmin, onLogout, darkMode }) {
  return (
    <div className="rounded-2xl shadow-lg p-3 sm:p-5 border border-cyan-900/60 bg-slate-900/85 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/70 mb-1">Airport Operations Interface</div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="max-w-full text-lg font-bold leading-tight sm:text-2xl" style={{ color: AVIATION_COLORS.accent }}>
            TUI Aircraft Logbook
          </h1>
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
            Build {APP_BUILD} ({APP_REVISION})
          </span>
          <span className="text-xs text-slate-400">{fleetCount} aircraft</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
        <div className="text-xs font-medium rounded-full px-2.5 py-1 border text-cyan-100 border-cyan-900/70 bg-slate-950/70">
          {currentUser}{isAdmin && " (Admin)"}
        </div>
        <div className="text-xs font-medium rounded-full px-2.5 py-1 border text-cyan-100 border-cyan-900/70 bg-slate-950/70">
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